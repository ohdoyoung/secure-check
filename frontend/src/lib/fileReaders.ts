import JSZip from "jszip";
import type { CodeFile, PastedCodeLanguageOption } from "../types/analysis";

const MAX_BROWSER_UPLOAD_FILES = 10_000;
const MAX_BROWSER_FILE_BYTES = 2 * 1024 * 1024;
const MAX_BROWSER_TOTAL_BYTES = 80 * 1024 * 1024;
const LOCAL_FILE_READ_CONCURRENCY = 24;
const ZIP_ENTRY_READ_CONCURRENCY = 16;

const SUPPORTED_EXTENSIONS = [
  ".java",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".py",
  ".php",
  ".sql",
  ".html",
  ".yml",
  ".yaml",
  ".properties",
  ".conf",
  ".json",
  ".xml",
  ".gradle",
  ".kts",
  ".toml",
  ".tf",
  ".tfvars",
  ".hcl",
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".dockerfile",
  "dockerfile",
  "requirements.txt",
  "requirements-dev.txt",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts"
];

const IGNORED_PATH_PARTS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "target",
  ".next",
  ".nuxt",
  "coverage",
  ".gradle",
  "vendor",
  "venv",
  ".venv",
  "__pycache__",
  ".mypy_cache",
  ".pytest_cache",
  ".cache",
  ".turbo",
  ".parcel-cache",
  ".yarn",
  ".pnpm-store",
  ".idea",
  ".vscode"
]);

function pathParts(path: string) {
  return path.split(/[\\/]+/).filter(Boolean);
}

export function isIgnoredPath(path: string) {
  return pathParts(path.toLowerCase()).some((part) => IGNORED_PATH_PARTS.has(part));
}

export function isSupportedFile(path: string) {
  const normalized = path.toLowerCase();
  const parts = pathParts(normalized);
  const name = parts.length > 0 ? parts[parts.length - 1] : normalized;
  if (isIgnoredPath(normalized)) return false;
  if (name.startsWith(".env")) return true;
  return SUPPORTED_EXTENSIONS.some((extension) => normalized.endsWith(extension) || name === extension);
}

export function detectLanguage(path: string) {
  const normalized = path.toLowerCase();
  if (normalized.endsWith(".java")) return "Java";
  if (normalized.endsWith(".js") || normalized.endsWith(".jsx") || normalized.endsWith(".mjs") || normalized.endsWith(".cjs")) return "JavaScript";
  if (normalized.endsWith(".ts") || normalized.endsWith(".tsx") || normalized.endsWith(".mts") || normalized.endsWith(".cts")) return "TypeScript";
  if (normalized.endsWith(".py")) return "Python";
  if (normalized.endsWith(".php")) return "PHP";
  if (normalized.endsWith(".sql")) return "SQL";
  if (normalized.endsWith("dockerfile") || normalized.endsWith(".dockerfile")) return "Dockerfile";
  if (normalized.endsWith(".yml") || normalized.endsWith(".yaml") || normalized.endsWith(".properties") || normalized.endsWith(".conf") || normalized.endsWith(".tf") || normalized.endsWith(".tfvars") || normalized.endsWith(".hcl") || normalized.includes(".env")) return "Config";
  if (normalized.endsWith("requirements.txt") || normalized.endsWith("requirements-dev.txt") || normalized.endsWith(".toml") || normalized.endsWith("pom.xml") || normalized.endsWith("build.gradle") || normalized.endsWith("build.gradle.kts") || normalized.endsWith("package.json")) return "Dependency";
  return "Dependency";
}

type PastedCodeMeta = {
  path: string;
  language: string;
};

const PASTED_CODE_LANGUAGE_META: Record<Exclude<PastedCodeLanguageOption, "auto">, PastedCodeMeta> = {
  Java: { path: "PastedCode.java", language: "Java" },
  JavaScript: { path: "PastedCode.js", language: "JavaScript" },
  TypeScript: { path: "PastedCode.ts", language: "TypeScript" },
  Python: { path: "PastedCode.py", language: "Python" },
  PHP: { path: "PastedCode.php", language: "PHP" },
  SQL: { path: "PastedCode.sql", language: "SQL" }
};

export type ReadStats = {
  files: CodeFile[];
  total: number;
  accepted: number;
  ignored: number;
};

type ZipReadOptions = {
  stripFirstPathSegment?: boolean;
  subdirectory?: string;
};

export function inferPastedCode(rawCode: string, overrideLanguage: PastedCodeLanguageOption = "auto"): PastedCodeMeta {
  if (overrideLanguage !== "auto") {
    return PASTED_CODE_LANGUAGE_META[overrideLanguage];
  }

  const code = rawCode.trim();

  if (/(^|\n)\s*(package\s+[\w.]+;|import\s+[\w.*]+;|public\s+(class|interface|record)|@RestController|@Controller|System\.out\.)/m.test(code)) {
    return { path: "PastedCode.java", language: "Java" };
  }

  if (/(^|\n)\s*(import\s+type\s+|interface\s+\w+|type\s+\w+\s*=)|:\s*(string|number|boolean|unknown|Record<|Promise<)\b/.test(code)) {
    return { path: "PastedCode.ts", language: "TypeScript" };
  }

  if (/(^|\n)\s*(import\s+.+\s+from\s+["']|export\s+(default\s+)?(function|const|class)|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|(?:const|let|var)\s+\{[^}]+}\s*=\s*require\s*\(|(?:app|router)\.(?:get|post|put|patch|delete|use)\s*\(|return\s*<)/m.test(code)) {
    return { path: "PastedCode.js", language: "JavaScript" };
  }

  if (/(^|\n)\s*(def\s+\w+\(|class\s+\w+[:(]|from\s+\w+(\.\w+)*\s+import\s+|import\s+\w+)|\bprint\s*\(/m.test(code)) {
    return { path: "PastedCode.py", language: "Python" };
  }

  if (/(^|\n)\s*(<\?php|\$[A-Za-z_]\w*\s*=|echo\s+[^;]+;)/m.test(code)) {
    return { path: "PastedCode.php", language: "PHP" };
  }

  if (/(^|\n)\s*(SELECT|INSERT|UPDATE|DELETE|GRANT|CREATE|ALTER|DROP)\b/im.test(code)) {
    return { path: "PastedCode.sql", language: "SQL" };
  }

  return { path: "PastedCode.js", language: "JavaScript" };
}

export function pastedCodeFile(rawCode: string): CodeFile[] {
  if (!rawCode.trim()) return [];
  return [
    {
      ...inferPastedCode(rawCode),
      content: rawCode
    }
  ];
}

export function pastedCodeFileWithLanguage(rawCode: string, overrideLanguage: PastedCodeLanguageOption): CodeFile[] {
  if (!rawCode.trim()) return [];
  return [
    {
      ...inferPastedCode(rawCode, overrideLanguage),
      content: rawCode
    }
  ];
}

function toUserFacingSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

function toUserFacingCount(count: number) {
  return count.toLocaleString("ko-KR");
}

export function ensureBrowserUploadCapacity(fileCount: number, nextBytes: number, totalBytes: number) {
  if (fileCount > MAX_BROWSER_UPLOAD_FILES) {
    throw new Error(`분석 대상 파일은 한 번에 최대 ${toUserFacingCount(MAX_BROWSER_UPLOAD_FILES)}개까지 읽을 수 있습니다.`);
  }
  if (nextBytes > MAX_BROWSER_FILE_BYTES) {
    throw new Error(`단일 파일은 최대 ${toUserFacingSize(MAX_BROWSER_FILE_BYTES)}까지만 읽을 수 있습니다.`);
  }
  if (totalBytes > MAX_BROWSER_TOTAL_BYTES) {
    throw new Error(`브라우저 업로드 총 용량은 최대 ${toUserFacingSize(MAX_BROWSER_TOTAL_BYTES)}까지만 읽을 수 있습니다.`);
  }
}

function ensureBrowserCandidateCount(fileCount: number) {
  if (fileCount > MAX_BROWSER_UPLOAD_FILES) {
    throw new Error(`분석 대상 후보가 ${toUserFacingCount(fileCount)}개입니다. 최대 ${toUserFacingCount(MAX_BROWSER_UPLOAD_FILES)}개까지 지원하므로 src/backend/frontend 같은 실제 소스 폴더만 선택해 주세요.`);
  }
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

export async function readTextFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList);
  const supportedFiles = files.filter((file) => isSupportedFile(file.webkitRelativePath || file.name));
  ensureBrowserCandidateCount(supportedFiles.length);
  let acceptedCount = 0;
  let acceptedBytes = 0;
  const codeFilesWithEmpty = await mapWithConcurrency(supportedFiles, LOCAL_FILE_READ_CONCURRENCY, async (file): Promise<CodeFile | null> => {
    const path = file.webkitRelativePath || file.name;
    const content = await file.text();
    if (!content.trim()) return null;
    acceptedCount += 1;
    acceptedBytes += file.size;
    ensureBrowserUploadCapacity(acceptedCount, file.size, acceptedBytes);
    return {
      path,
      language: detectLanguage(path),
      content
    } satisfies CodeFile;
  });
  const codeFiles = codeFilesWithEmpty.filter((file): file is CodeFile => file !== null);
  return codeFiles;
}

export async function readTextFilesWithStats(fileList: FileList | File[]): Promise<ReadStats> {
  const files = Array.from(fileList);
  const codeFiles = await readTextFiles(files);
  return {
    files: codeFiles,
    total: files.length,
    accepted: codeFiles.length,
    ignored: Math.max(files.length - codeFiles.length, 0)
  };
}

export async function readZipFile(file: File) {
  return (await readZipFileWithStats(file)).files;
}

export async function readZipFileWithStats(file: File, options?: ZipReadOptions): Promise<ReadStats> {
  return readZipBlobWithStats(file, options);
}

export async function readZipBlob(blob: Blob) {
  return (await readZipBlobWithStats(blob)).files;
}

function normalizeZipEntryName(name: string, options?: ZipReadOptions) {
  const baseName = options?.stripFirstPathSegment
    ? pathParts(name).slice(1).join("/")
    : name;

  if (!options?.subdirectory) return baseName;

  const normalizedPrefix = options.subdirectory.replace(/^\/+|\/+$/g, "");
  if (!normalizedPrefix) return baseName;
  const prefixWithSlash = `${normalizedPrefix}/`;
  if (baseName === normalizedPrefix) return "";
  if (baseName.startsWith(prefixWithSlash)) return baseName.slice(prefixWithSlash.length);
  return null;
}

export async function readZipBlobWithStats(blob: Blob, options?: ZipReadOptions): Promise<ReadStats> {
  const zip = await JSZip.loadAsync(blob);
  const allEntries = Object.values(zip.files).filter((entry) => !entry.dir);
  const normalizedEntries = allEntries
    .map((entry) => ({
      entry,
      normalizedName: normalizeZipEntryName(entry.name, options)
    }))
    .filter((item): item is { entry: JSZip.JSZipObject; normalizedName: string } => item.normalizedName !== null && item.normalizedName !== "");
  const entries = normalizedEntries.filter(({ normalizedName }) => isSupportedFile(normalizedName));
  ensureBrowserCandidateCount(entries.length);
  let acceptedCount = 0;
  let acceptedBytes = 0;
  const codeFilesWithEmpty = await mapWithConcurrency(entries, ZIP_ENTRY_READ_CONCURRENCY, async ({ entry, normalizedName }): Promise<CodeFile | null> => {
    const contentBlob = await entry.async("blob");
    const content = await contentBlob.text();
    if (!content.trim()) return null;
    acceptedCount += 1;
    acceptedBytes += contentBlob.size;
    ensureBrowserUploadCapacity(acceptedCount, contentBlob.size, acceptedBytes);
    return {
      path: normalizedName,
      language: detectLanguage(normalizedName),
      content
    };
  });
  const codeFiles = codeFilesWithEmpty.filter((file): file is CodeFile => file !== null);
  return {
    files: codeFiles,
    total: normalizedEntries.length,
    accepted: codeFiles.length,
    ignored: Math.max(normalizedEntries.length - codeFiles.length, 0)
  };
}

type BrowserFileEntry = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  file: (success: (file: File) => void, error?: (error: DOMException) => void) => void;
  createReader: () => {
    readEntries: (success: (entries: BrowserFileEntry[]) => void, error?: (error: DOMException) => void) => void;
  };
};

async function entryToFiles(entry: BrowserFileEntry, parentPath = ""): Promise<File[]> {
  const path = `${parentPath}${entry.name}`;
  if (isIgnoredPath(path)) {
    return [];
  }

  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      entry.file(
        (file) => {
          Object.defineProperty(file, "webkitRelativePath", {
            value: path,
            configurable: true
          });
          resolve([file]);
        },
        (error) => reject(error)
      );
    });
  }

  if (!entry.isDirectory) {
    return [];
  }

  const reader = entry.createReader();
  const entries: BrowserFileEntry[] = [];

  async function readBatch(): Promise<void> {
    const batch = await new Promise<BrowserFileEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (batch.length === 0) return;
    entries.push(...batch);
    await readBatch();
  }

  await readBatch();
  const nestedFiles = await mapWithConcurrency(entries, LOCAL_FILE_READ_CONCURRENCY, (child) => entryToFiles(child, `${path}/`));
  return nestedFiles.flat();
}

export async function readDroppedItems(items: DataTransferItemList) {
  const entries = Array.from(items)
    .map((item) => {
      const browserItem = item as DataTransferItem & {
        webkitGetAsEntry?: () => unknown;
      };
      return browserItem.webkitGetAsEntry?.() as BrowserFileEntry | null | undefined;
    })
    .filter((entry): entry is BrowserFileEntry => Boolean(entry));

  if (entries.length === 0) {
    return [];
  }

  const files = (await Promise.all(entries.map((entry) => entryToFiles(entry)))).flat();
  return readTextFiles(files);
}

export async function readDroppedItemsWithStats(items: DataTransferItemList): Promise<ReadStats> {
  const entries = Array.from(items)
    .map((item) => {
      const browserItem = item as DataTransferItem & {
        webkitGetAsEntry?: () => unknown;
      };
      return browserItem.webkitGetAsEntry?.() as BrowserFileEntry | null | undefined;
    })
    .filter((entry): entry is BrowserFileEntry => Boolean(entry));

  if (entries.length === 0) {
    return { files: [], total: 0, accepted: 0, ignored: 0 };
  }

  const files = (await Promise.all(entries.map((entry) => entryToFiles(entry)))).flat();
  return readTextFilesWithStats(files);
}

export function exampleSpringCode() {
  return `package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import java.sql.*;

@RestController
@RequestMapping("/users")
public class UserController {
    private String jwtSecret = "hard-coded-secret-123";

    @GetMapping
    public ResultSet findUser(@RequestParam String email) throws Exception {
        Statement statement = connection.createStatement();
        System.out.println("debug email=" + email);
        return statement.executeQuery("SELECT * FROM users WHERE email = '" + email + "'");
    }
}`;
}
