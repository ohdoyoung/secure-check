export type GithubRepositoryTarget = {
  owner: string;
  repo: string;
  projectName: string;
  refCandidates: Array<{
    ref: string;
    subdirectory: string;
  }>;
};

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
  const refCandidates = section === "tree" && rest.length > 0
    ? uniqueRefCandidates(rest)
    : [{ ref: "main", subdirectory: "" }, { ref: "master", subdirectory: "" }];

  return {
    owner,
    repo,
    projectName: `${owner}/${repo}`,
    refCandidates
  };
}

export function buildGithubZipUrl(owner: string, repo: string, ref: string) {
  const encodedRef = ref.split("/").map(encodeURIComponent).join("/");
  return `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${encodedRef}`;
}
