import type { CodeFile } from "../types/analysis";
import { detectLanguage, ensureBrowserUploadCapacity, isSupportedFile } from "./fileReaders";

export type GithubRepositoryTarget = {
  owner: string;
  repo: string;
  projectName: string;
  hasExplicitRef: boolean;
  refCandidates: Array<{
    ref: string;
    subdirectory: string;
  }>;
};

export type GithubReadStats = {
  files: CodeFile[];
  total: number;
  accepted: number;
  ignored: number;
  projectName: string;
  resolvedRef: string;
  resolvedSubdirectory: string;
};

type GithubRepositoryMetadataResponse = {
  full_name?: string;
  private?: boolean;
  default_branch?: string;
};

type GithubRepositoryMetadata = GithubRepositoryMetadataResponse & {
  default_branch: string;
};

type GithubRefResponse = {
  object?: {
    sha?: string;
    type?: string;
  };
};

type GithubTreeEntry = {
  path: string;
  type: string;
  size?: number;
};

type GithubTreeResponse = {
  tree?: GithubTreeEntry[];
  truncated?: boolean;
};

const GITHUB_API_BASE_URL = "https://api.github.com";
const GITHUB_RAW_BASE_URL = "https://raw.githubusercontent.com";
const GITHUB_REQUEST_TIMEOUT_MS = 15000;
const GITHUB_RAW_FETCH_CONCURRENCY = 8;

class GithubHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GithubHttpError";
    this.status = status;
  }
}

function normalizeGithubUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error("GitHub 저장소 URL을 입력해 주세요.");
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function uniqueRefCandidates(parts: string[]) {
  const seen = new Set<string>();
  const candidates: Array<{ ref: string; subdirectory: string }> = [];

  for (let refLength = parts.length; refLength >= 1; refLength -= 1) {
    const ref = parts.slice(0, refLength).join("/");
    const subdirectory = parts.slice(refLength).join("/");
    const key = `${ref}::${subdirectory}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ ref, subdirectory });
  }

  return candidates;
}

export function parseGithubRepository(rawUrl: string): GithubRepositoryTarget {
  const url = new URL(normalizeGithubUrl(rawUrl));
  if (url.hostname !== "github.com") {
    throw new Error("github.com 공개 저장소 URL만 지원합니다.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("owner/repository 형식의 GitHub URL을 입력해 주세요.");
  }

  const [owner, rawRepo, section, ...rest] = parts;
  const repo = rawRepo.replace(/\.git$/i, "");
  const hasExplicitRef = section === "tree" && rest.length > 0;
  const refCandidates = hasExplicitRef
    ? uniqueRefCandidates(rest)
    : [{ ref: "main", subdirectory: "" }, { ref: "master", subdirectory: "" }];

  return {
    owner,
    repo,
    projectName: `${owner}/${repo}`,
    hasExplicitRef,
    refCandidates
  };
}

function encodePathSegments(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function githubApiUrl(owner: string, repo: string, path: string) {
  const repositoryUrl = `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  return path ? `${repositoryUrl}/${path}` : repositoryUrl;
}

function githubRawUrl(owner: string, repo: string, ref: string, path: string) {
  return `${GITHUB_RAW_BASE_URL}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(ref)}/${encodePathSegments(path)}`;
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), GITHUB_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("GitHub 응답이 지연되고 있습니다. 잠시 후 다시 시도하거나 ZIP 업로드를 사용해 주세요.");
    }
    if (error instanceof TypeError) {
      throw new Error("GitHub 저장소를 브라우저에서 읽지 못했습니다. 공개 저장소인지 확인하거나 ZIP 업로드를 사용해 주세요.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function readGithubErrorMessage(response: Response) {
  try {
    const payload = await response.json() as { message?: string };
    return payload.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

function githubHttpMessage(status: number, message: string) {
  if (status === 403 && /rate limit/i.test(message)) {
    return "GitHub API 요청 한도를 초과했습니다. 잠시 후 다시 시도하거나 ZIP 업로드를 사용해 주세요.";
  }
  if (status === 404) {
    return "GitHub 공개 저장소, 브랜치 또는 경로를 찾지 못했습니다.";
  }
  return `GitHub 저장소를 읽지 못했습니다. (${status})`;
}

async function fetchGithubJson<T>(url: string): Promise<T> {
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    const message = await readGithubErrorMessage(response);
    throw new GithubHttpError(response.status, githubHttpMessage(response.status, message));
  }

  return await response.json() as T;
}

async function fetchGithubText(url: string) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new GithubHttpError(response.status, `GitHub 파일을 읽지 못했습니다. (${response.status})`);
  }
  return await response.text();
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function normalizeTreeEntryPath(path: string, subdirectory: string) {
  const normalizedSubdirectory = subdirectory.replace(/^\/+|\/+$/g, "");
  if (!normalizedSubdirectory) return path;

  const prefix = `${normalizedSubdirectory}/`;
  if (path === normalizedSubdirectory) return "";
  if (path.startsWith(prefix)) return path.slice(prefix.length);
  return null;
}

async function fetchRepositoryMetadata(repository: GithubRepositoryTarget) {
  const metadata = await fetchGithubJson<GithubRepositoryMetadataResponse>(
    githubApiUrl(repository.owner, repository.repo, "")
  );

  if (metadata.private) {
    throw new Error("private 저장소 인증은 아직 지원하지 않습니다. 공개 저장소 또는 ZIP 업로드를 사용해 주세요.");
  }
  if (!metadata.default_branch) {
    throw new Error("GitHub 저장소의 기본 브랜치를 확인하지 못했습니다.");
  }

  return {
    ...metadata,
    default_branch: metadata.default_branch
  } satisfies GithubRepositoryMetadata;
}

async function fetchBranchCommitSha(repository: GithubRepositoryTarget, ref: string) {
  const branchRef = encodePathSegments(ref);
  const payload = await fetchGithubJson<GithubRefResponse>(
    githubApiUrl(repository.owner, repository.repo, `git/ref/heads/${branchRef}`)
  );
  const sha = payload.object?.sha;

  if (!sha) {
    throw new GithubHttpError(404, "GitHub 브랜치를 찾지 못했습니다.");
  }

  return sha;
}

async function fetchRepositoryTree(repository: GithubRepositoryTarget, commitSha: string) {
  const tree = await fetchGithubJson<GithubTreeResponse>(
    githubApiUrl(repository.owner, repository.repo, `git/trees/${encodeURIComponent(commitSha)}?recursive=1`)
  );

  if (tree.truncated) {
    throw new Error("저장소 파일 목록이 너무 커서 브라우저에서 일부만 내려왔습니다. ZIP 업로드를 사용해 주세요.");
  }

  return tree.tree ?? [];
}

async function readGithubCandidate(repository: GithubRepositoryTarget, ref: string, subdirectory: string) {
  const commitSha = await fetchBranchCommitSha(repository, ref);
  const treeEntries = await fetchRepositoryTree(repository, commitSha);
  const normalizedEntries = treeEntries
    .filter((entry) => entry.type === "blob")
    .map((entry) => ({
      entry,
      normalizedPath: normalizeTreeEntryPath(entry.path, subdirectory)
    }))
    .filter((item): item is { entry: GithubTreeEntry; normalizedPath: string } => item.normalizedPath !== null && item.normalizedPath !== "");

  if (subdirectory && normalizedEntries.length === 0) {
    throw new GithubHttpError(404, "GitHub 하위 폴더를 찾지 못했습니다.");
  }

  const supportedEntries = normalizedEntries.filter(({ normalizedPath }) => isSupportedFile(normalizedPath));
  let acceptedBytes = 0;
  supportedEntries.forEach(({ entry }, index) => {
    const size = entry.size ?? 0;
    acceptedBytes += size;
    ensureBrowserUploadCapacity(index + 1, size, acceptedBytes);
  });

  const filesWithEmpty = await mapWithConcurrency(supportedEntries, GITHUB_RAW_FETCH_CONCURRENCY, async ({ entry, normalizedPath }): Promise<CodeFile | null> => {
    const content = await fetchGithubText(githubRawUrl(repository.owner, repository.repo, commitSha, entry.path));
    if (!content.trim()) return null;
    return {
      path: normalizedPath,
      language: detectLanguage(normalizedPath),
      content
    } satisfies CodeFile;
  });
  const files = filesWithEmpty.filter((file): file is CodeFile => file !== null);

  return {
    files,
    total: normalizedEntries.length,
    accepted: files.length,
    ignored: Math.max(normalizedEntries.length - files.length, 0)
  };
}

export async function readGithubRepositoryWithStats(rawUrl: string): Promise<GithubReadStats> {
  const repository = parseGithubRepository(rawUrl);
  const metadata = await fetchRepositoryMetadata(repository);
  const candidates = repository.hasExplicitRef
    ? repository.refCandidates
    : [{ ref: metadata.default_branch, subdirectory: "" }];
  let lastNotFoundError: unknown = null;

  for (const candidate of candidates) {
    try {
      const stats = await readGithubCandidate(repository, candidate.ref, candidate.subdirectory);
      return {
        ...stats,
        projectName: metadata.full_name ?? repository.projectName,
        resolvedRef: candidate.ref,
        resolvedSubdirectory: candidate.subdirectory
      };
    } catch (error) {
      if (error instanceof GithubHttpError && error.status === 404) {
        lastNotFoundError = error;
        continue;
      }
      throw error;
    }
  }

  if (repository.hasExplicitRef) {
    throw new Error("GitHub /tree/브랜치 또는 하위 폴더를 찾지 못했습니다. 저장소의 실제 브랜치명과 경로를 확인해 주세요.");
  }

  throw lastNotFoundError instanceof Error
    ? lastNotFoundError
    : new Error("GitHub 저장소를 읽지 못했습니다.");
}
