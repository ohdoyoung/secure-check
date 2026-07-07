import { useRef, useState } from "react";
import {
  Activity,
  Archive,
  ChevronDown,
  CheckCircle2,
  ClipboardEdit,
  FileCode2,
  FolderOpen,
  Github,
  Loader2,
  Play,
  SlidersHorizontal,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import { useAnalysisMutation } from "../hooks/useAnalysisMutation";
import {
  inferPastedCode,
  pastedCodeFileWithLanguage,
  readDroppedItemsWithStats,
  readTextFilesWithStats,
  readZipFileWithStats
} from "../lib/fileReaders";
import { readGithubRepositoryWithStats } from "../lib/github";
import { useCheckupStore } from "../store/useCheckupStore";
import type { FindingSuppression, InputMode, PastedCodeLanguageOption } from "../types/analysis";

const modes: Array<{ mode: InputMode; label: string; icon: typeof ClipboardEdit; recommended?: boolean }> = [
  { mode: "paste", label: "코드 입력", icon: ClipboardEdit },
  { mode: "file", label: "파일", icon: FileCode2 },
  { mode: "zip", label: "ZIP", icon: Archive, recommended: true },
  { mode: "folder", label: "폴더", icon: FolderOpen },
  { mode: "github", label: "GitHub", icon: Github }
];

const MIN_ANALYSIS_FEEDBACK_MS = 900;
const pastedLanguageOptions: Array<{ value: PastedCodeLanguageOption; label: string }> = [
  { value: "auto", label: "자동 감지" },
  { value: "Java", label: "Java" },
  { value: "JavaScript", label: "JavaScript" },
  { value: "TypeScript", label: "TypeScript" },
  { value: "Python", label: "Python" },
  { value: "PHP", label: "PHP" },
  { value: "SQL", label: "SQL" }
];

type RuleExclusionPreset = {
  id: string;
  label: string;
  description: string;
  ruleIds: string[];
};

const ruleExclusionPresets: RuleExclusionPreset[] = [
  {
    id: "dependency-import",
    label: "의존성 신호",
    description: "패키지/레지스트리/import 계열",
    ruleIds: [
      "GEN_DEPENDENCY_HTTP_001",
      "GEN_DEPENDENCY_WILDCARD_VERSION_001",
      "GEN_GITHUB_ACTION_UNPINNED_001",
      "GEN_NPM_INSTALL_SCRIPT_001",
      "PY_REQUESTS_NO_TIMEOUT_001",
      "PY_XML_XXE_001"
    ]
  },
  {
    id: "low-signal",
    label: "정보성 룰",
    description: "상세 예외, target_blank 등",
    ruleIds: [
      "BUILTIN_DEPRECATED_API_001",
      "BUILTIN_DEBUG_CODE_001",
      "BUILTIN_EXCEPTION_HANDLING_001",
      "GEN_ERROR_001",
      "JS-KISA-012",
      "PHP_ERROR_001",
      "REACT_TARGET_BLANK_001"
    ]
  },
  {
    id: "dev-config",
    label: "개발용 설정",
    description: "DEBUG, H2 console 등",
    ruleIds: [
      "PY_FLASK_DEBUG_001",
      "PY_DJANGO_DEBUG_001",
      "SPRING_H2_CONSOLE_001",
      "NODE_GRAPHQL_INTROSPECTION_001"
    ]
  },
  {
    id: "quality-logging",
    label: "로그·품질 신호",
    description: "민감 로그, any 캐스팅 등",
    ruleIds: [
      "BUILTIN_SENSITIVE_LOG_001",
      "GEN_LOG_001",
      "JAVA_LOG_001",
      "TS_TYPE_001",
      "JAVA_RANDOM_001"
    ]
  }
];

function buildRuleSuppressions(enabledPresetIds: string[]): FindingSuppression[] {
  const selectedPresetIds = new Set(enabledPresetIds);
  const reasons = new Map<string, string>();

  for (const preset of ruleExclusionPresets) {
    if (!selectedPresetIds.has(preset.id)) continue;

    for (const ruleId of preset.ruleIds) {
      if (!reasons.has(ruleId)) {
        reasons.set(ruleId, preset.label);
      }
    }
  }

  return Array.from(reasons.entries()).map(([ruleId, label]) => ({
    scope: "rule",
    ruleId,
    reason: `일반 룰 제외: ${label}`
  }));
}

type UploadPanelProps = {
  onAnalysisComplete?: () => void;
};

type SelectionAudit = {
  source: string;
  total: number;
  accepted: number;
  ignored: number;
};

export function UploadPanel({ onAnalysisComplete }: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isReadingGithub, setIsReadingGithub] = useState(false);
  const [analysisStartedAt, setAnalysisStartedAt] = useState("");
  const [submittedFileCount, setSubmittedFileCount] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState<"idle" | "running" | "complete">("idle");
  const [showCompletionNotice, setShowCompletionNotice] = useState(false);
  const [selectionAudit, setSelectionAudit] = useState<SelectionAudit | null>(null);
  const [enabledExclusionPresets, setEnabledExclusionPresets] = useState<string[]>([]);
  const [isExclusionMenuOpen, setIsExclusionMenuOpen] = useState(false);
  const mutation = useAnalysisMutation();
  const {
    inputMode,
    projectName,
    rawCode,
    pastedCodeLanguage,
    stagedFiles,
    setInputMode,
    setProjectName,
    setRawCode,
    setPastedCodeLanguage,
    setStagedFiles,
    setResultFiles,
    loadExample
  } = useCheckupStore();

  const selectedMode = modes.find((item) => item.mode === inputMode) ?? modes[0];
  const SelectedModeIcon = selectedMode.icon;
  const selectedLineCount = inputMode === "paste"
    ? rawCode.split("\n").length
    : stagedFiles.reduce((sum, file) => sum + file.content.split("\n").length, 0);
  const selectedFileCount = inputMode === "paste" ? (rawCode.trim() ? 1 : 0) : stagedFiles.length;
  const pastedCodeMeta = inputMode === "paste" ? inferPastedCode(rawCode, pastedCodeLanguage) : undefined;
  const isAnalysisRunning = mutation.isPending || analysisPhase === "running";
  const mutationMessage = mutation.error instanceof Error ? mutation.error.message : "";
  const feedbackMessage = localMessage || mutationMessage;
  const feedbackIsError = Boolean(mutationMessage && !localMessage);
  const selectedSuppressions = buildRuleSuppressions(enabledExclusionPresets);
  const excludedRuleCount = selectedSuppressions.length;

  const clearAnalysisFeedback = () => {
    mutation.reset();
    setLocalMessage("");
    setShowCompletionNotice(false);
  };

  const handleModeSelection = (mode: InputMode) => {
    clearAnalysisFeedback();
    if (mode !== inputMode) {
      setStagedFiles([]);
      setSelectionAudit(null);
    }
    setInputMode(mode);
  };

  const toggleExclusionPreset = (presetId: string) => {
    setEnabledExclusionPresets((current) =>
      current.includes(presetId)
        ? current.filter((id) => id !== presetId)
        : [...current, presetId]
    );
  };

  const runAnalysis = () => {
    mutation.reset();
    const files = inputMode === "paste" ? pastedCodeFileWithLanguage(rawCode, pastedCodeLanguage) : stagedFiles;
    if (files.length === 0) {
      setLocalMessage("분석할 코드 파일을 찾지 못했습니다. 폴더 선택 후 파일 수가 0개라면 src, backend, frontend 같은 실제 소스 폴더가 포함된 상위 폴더를 다시 선택해 주세요.");
      return;
    }
    setLocalMessage("");
    setShowCompletionNotice(false);
    setAnalysisPhase("running");
    setSubmittedFileCount(files.length);
    setResultFiles(files);
    setAnalysisStartedAt(new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date()));
    const feedbackStartedAt = Date.now();
    mutation.mutate({
      projectName: projectName.trim() || "취약했네 프로젝트",
      files,
      suppressions: selectedSuppressions
    }, {
      onSuccess: () => {
        const remainingFeedbackMs = Math.max(MIN_ANALYSIS_FEEDBACK_MS - (Date.now() - feedbackStartedAt), 0);
        window.setTimeout(() => {
          setAnalysisPhase("complete");
          setShowCompletionNotice(true);
          window.setTimeout(() => {
            onAnalysisComplete?.();
          }, 650);
          window.setTimeout(() => {
            setShowCompletionNotice(false);
            setAnalysisPhase("idle");
          }, 3600);
        }, remainingFeedbackMs);
      },
      onError: () => {
        setAnalysisPhase("idle");
        setShowCompletionNotice(false);
      }
    });
  };

  const handleLoadExample = () => {
    clearAnalysisFeedback();
    loadExample();
    setSelectionAudit(null);
  };

  const clearSelectionOnError = (fallbackMessage: string, error: unknown) => {
    setStagedFiles([]);
    setSelectionAudit(null);
    setLocalMessage(error instanceof Error ? error.message : fallbackMessage);
  };

  const handleFileSelection = async (files: FileList | null) => {
    if (!files) return;
    clearAnalysisFeedback();
    try {
      const stats = await readTextFilesWithStats(files);
      setStagedFiles(stats.files);
      setSelectionAudit({
        source: inputMode === "folder" ? "프로젝트 폴더" : "파일 선택",
        total: stats.total,
        accepted: stats.accepted,
        ignored: stats.ignored
      });
      setLocalMessage(
        stats.files.length > 0
          ? `${stats.files.length}개 코드/설정 파일이 준비되었습니다.`
          : `선택한 ${stats.total}개 파일 중 분석 가능한 코드 파일을 찾지 못했습니다. node_modules/dist/build는 제외하고 .java .js .ts .tsx .py .php .sql .json .yml .env Dockerfile 등을 찾습니다.`
      );
    } catch (error) {
      clearSelectionOnError("파일을 읽는 중 문제가 발생했습니다.", error);
    }
  };

  const handleZipSelection = async (files: FileList | null) => {
    const zip = files?.[0];
    if (!zip) return;
    clearAnalysisFeedback();
    try {
      const stats = await readZipFileWithStats(zip);
      setStagedFiles(stats.files);
      setSelectionAudit({
        source: "ZIP",
        total: stats.total,
        accepted: stats.accepted,
        ignored: stats.ignored
      });
      setProjectName(projectName || zip.name.replace(/\.zip$/i, ""));
      setLocalMessage(
        stats.files.length > 0
          ? `${stats.files.length}개 코드/설정 파일을 ZIP에서 읽었습니다.`
          : "ZIP 안에서 분석 가능한 코드 파일을 찾지 못했습니다. 압축 안에 src/backend/frontend 같은 소스 폴더가 들어있는지 확인해 주세요."
      );
    } catch (error) {
      clearSelectionOnError("ZIP 파일을 읽는 중 문제가 발생했습니다.", error);
    }
  };

  const handleGithubImport = async () => {
    clearAnalysisFeedback();
    setIsReadingGithub(true);

    try {
      const stats = await readGithubRepositoryWithStats(githubUrl);
      setStagedFiles(stats.files);
      setSelectionAudit({
        source: stats.resolvedSubdirectory ? `GitHub · ${stats.resolvedSubdirectory}` : "GitHub",
        total: stats.total,
        accepted: stats.accepted,
        ignored: stats.ignored
      });
      setInputMode("github");
      setProjectName(stats.projectName);
      setLocalMessage(
        stats.files.length > 0
          ? `${stats.projectName}@${stats.resolvedRef}${stats.resolvedSubdirectory ? `/${stats.resolvedSubdirectory}` : ""}에서 ${stats.files.length}개 코드/설정 파일을 읽었습니다.`
          : stats.resolvedSubdirectory
            ? "선택한 GitHub 하위 폴더에서 분석 가능한 코드 파일을 찾지 못했습니다."
            : "저장소에서 분석 가능한 코드 파일을 찾지 못했습니다."
      );
    } catch (error) {
      setStagedFiles([]);
      setSelectionAudit(null);
      setLocalMessage(error instanceof Error ? error.message : "GitHub 저장소를 읽는 중 문제가 발생했습니다.");
    } finally {
      setIsReadingGithub(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    clearAnalysisFeedback();
    try {
      if (event.dataTransfer.items.length > 0) {
        const stats = await readDroppedItemsWithStats(event.dataTransfer.items);
        if (stats.files.length > 0) {
          setStagedFiles(stats.files);
          setInputMode("folder");
          setSelectionAudit({
            source: "드래그앤드롭",
            total: stats.total,
            accepted: stats.accepted,
            ignored: stats.ignored
          });
          setLocalMessage(`${stats.files.length}개 코드/설정 파일이 준비되었습니다.`);
          return;
        }
      }
      const stats = await readTextFilesWithStats(event.dataTransfer.files);
      setStagedFiles(stats.files);
      setInputMode(stats.files.length > 1 ? "folder" : "file");
      setSelectionAudit({
        source: "드래그앤드롭",
        total: stats.total,
        accepted: stats.accepted,
        ignored: stats.ignored
      });
      setLocalMessage(
        stats.files.length > 0
          ? `${stats.files.length}개 코드/설정 파일이 준비되었습니다.`
          : "드롭한 항목에서 분석 가능한 코드 파일을 찾지 못했습니다. 프로젝트 폴더 또는 ZIP을 다시 넣어 주세요."
      );
    } catch (error) {
      clearSelectionOnError("드롭한 항목을 읽는 중 문제가 발생했습니다.", error);
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
            <ShieldCheck size={15} className="text-slate-700" />
            AI 기반 시큐어코딩 건강검진 서비스
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1.5">
            <h1 className="text-2xl font-black text-slate-950">프로젝트 보안 건강검진</h1>
            <p className="pb-0.5 text-sm font-semibold text-slate-500">당신의 코드는... 취약했네.</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["KISA JS 32/42", "OWASP 11", "다언어 룰 123", "샘플 검증 332개"].map((item) => (
              <span key={item} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
                {item}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadExample}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <ClipboardEdit size={15} />
          취약 샘플
        </button>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
          <label className="block">
            <span className="text-xs font-black uppercase text-slate-500">Project</span>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="my-project"
              className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500"
            />
          </label>

          <div className="mt-6">
            <p className="text-xs font-black uppercase text-slate-500">Source</p>
            <div className="mt-2 space-y-1.5">
              {modes.map(({ mode, label, icon: Icon, recommended }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeSelection(mode)}
                  className={`flex h-10 w-full items-center justify-between rounded-md px-3 text-sm font-bold transition ${
                    inputMode === mode
                      ? "border border-slate-300 bg-white text-slate-950 shadow-panel"
                      : "border border-transparent text-slate-600 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={17} />
                    {label}
                  </span>
                  {recommended && <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">추천</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-xs font-black uppercase text-slate-500">Target</p>
            <dl className="mt-3 space-y-2 text-sm">
              <SummaryRow label="방식" value={selectedMode.label} />
              <SummaryRow label="파일" value={`${selectedFileCount}개`} />
              <SummaryRow label="라인" value={`${selectedLineCount}줄`} />
              <SummaryRow label="일반 룰" value={excludedRuleCount > 0 ? `${excludedRuleCount}개 제외` : "제외 없음"} />
              {pastedCodeMeta && <SummaryRow label="언어" value={pastedCodeLanguage === "auto" ? `${pastedCodeMeta.language} · 자동` : `${pastedCodeMeta.language} · 수동`} />}
            </dl>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="text-xs font-black uppercase text-slate-500">Languages</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Java", "Spring", "JS/TS", "Python", "PHP", "SQL", "Docker/K8s"].map((language) => (
                <span key={language} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {language}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="text-xs font-black uppercase text-slate-500">Rule Base</p>
            <dl className="mt-3 space-y-2 text-sm">
              <SummaryRow label="활성 룰" value="166개" />
              <SummaryRow label="KISA JS" value="76.19%" />
              <SummaryRow label="샘플 지표" value="P/R 100%" />
            </dl>
          </div>
        </aside>

        <div className="p-4 lg:p-5">
          <RuleExclusionPanel
            presets={ruleExclusionPresets}
            selectedIds={enabledExclusionPresets}
            excludedRuleCount={excludedRuleCount}
            open={isExclusionMenuOpen}
            onOpenChange={setIsExclusionMenuOpen}
            onToggle={toggleExclusionPreset}
          />

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-lg border transition ${
              isDragging ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <SelectedModeIcon size={17} />
                {selectedMode.label}
              </div>
              <span className="text-xs font-bold text-slate-400">{selectedFileCount} files</span>
            </div>

            {inputMode === "paste" && (
              <div className="rounded-b-lg bg-white">
                <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-500">Paste Language</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      자동 감지가 애매하면 분석 언어를 직접 고를 수 있습니다.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span>언어</span>
                    <select
                      value={pastedCodeLanguage}
                      onChange={(event) => setPastedCodeLanguage(event.target.value as PastedCodeLanguageOption)}
                      className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                    >
                      {pastedLanguageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <textarea
                  value={rawCode}
                  onChange={(event) => {
                    mutation.reset();
                    setRawCode(event.target.value);
                  }}
                  placeholder={"검진할 코드를 붙여넣으세요.\n예: Express 라우터, Spring Controller, Python API 핸들러"}
                  className="scrollbar-thin h-[377px] w-full resize-none rounded-b-lg border-0 bg-white p-5 font-mono text-sm leading-6 text-slate-800 focus:outline-none"
                />
              </div>
            )}

            {inputMode === "file" && (
              <PickerState
                icon={FileCode2}
                title="단일 파일"
                meta=".java .js .jsx .ts .tsx .py .php .sql .json .yml .tf .env Dockerfile package.json"
                buttonLabel="파일 선택"
                onClick={() => fileInputRef.current?.click()}
              />
            )}

            {inputMode === "zip" && (
              <PickerState
                icon={Archive}
                title="ZIP 아카이브"
                meta=".zip · 코드/설정 최대 10,000개"
                buttonLabel="ZIP 선택"
                onClick={() => zipInputRef.current?.click()}
              />
            )}

            {inputMode === "folder" && (
              <PickerState
                icon={FolderOpen}
                title="프로젝트 폴더"
                meta="소스 기준 최대 10,000개"
                buttonLabel="폴더 선택"
                onClick={() => folderInputRef.current?.click()}
              />
            )}

            {inputMode === "github" && (
              <GithubState
                value={githubUrl}
                loading={isReadingGithub}
                onChange={setGithubUrl}
                onSubmit={handleGithubImport}
              />
            )}
          </div>

          {stagedFiles.length > 0 && inputMode !== "paste" && (
            <div className="mt-3 max-h-28 overflow-auto rounded-lg border border-slate-200 bg-white">
              {stagedFiles.slice(0, 6).map((file) => (
                <div key={file.path} className="flex h-9 items-center justify-between border-b border-slate-100 px-3 text-xs last:border-b-0">
                  <span className="truncate font-semibold text-slate-700">{file.path}</span>
                  <span className="ml-3 shrink-0 font-bold text-slate-400">{file.language}</span>
                </div>
              ))}
            </div>
          )}

          {selectionAudit && inputMode !== "paste" && (
            <UploadAudit audit={selectionAudit} />
          )}

          <input ref={fileInputRef} type="file" accept=".java,.js,.jsx,.mjs,.cjs,.ts,.tsx,.mts,.cts,.py,.php,.sql,.html,.json,.yml,.yaml,.properties,.conf,.env,.dockerfile,.toml,.tf,.tfvars,.hcl,.xml,.gradle,.kts,.txt" className="hidden" onChange={(event) => handleFileSelection(event.target.files)} />
          <input ref={zipInputRef} type="file" accept=".zip" className="hidden" onChange={(event) => handleZipSelection(event.target.files)} />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => handleFileSelection(event.target.files)}
            {...{ webkitdirectory: "", directory: "" }}
          />

          {feedbackMessage && (
            <p className={`mt-4 text-sm font-semibold ${feedbackIsError ? "text-red-600" : "text-slate-500"}`}>
              {feedbackMessage}
            </p>
          )}

          {isAnalysisRunning && (
            <AnalysisProgress
              fileCount={submittedFileCount || selectedFileCount}
              lineCount={selectedLineCount}
              startedAt={analysisStartedAt}
            />
          )}

          {analysisPhase === "complete" && showCompletionNotice && !mutation.error && (
            <CompletionNotice fileCount={submittedFileCount || selectedFileCount} />
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <UploadCloud size={17} />
              {isAnalysisRunning ? "요청 접수 완료 · 결과 생성 중" : "검사 대상이 준비되면 실행할 수 있습니다."}
            </div>
            <button
              type="button"
              onClick={runAnalysis}
              disabled={isAnalysisRunning || (inputMode === "github" && stagedFiles.length === 0)}
              aria-busy={isAnalysisRunning}
              aria-label={isAnalysisRunning ? "분석 진행 중" : "건강검진 시작"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-black text-white shadow-panel transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isAnalysisRunning ? <Loader2 size={17} className="animate-spin" /> : <Play size={17} />}
              <span>{isAnalysisRunning ? "분석 진행 중" : "건강검진 시작"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RuleExclusionPanel({
  presets,
  selectedIds,
  excludedRuleCount,
  open,
  onOpenChange,
  onToggle
}: {
  presets: RuleExclusionPreset[];
  selectedIds: string[];
  excludedRuleCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (presetId: string) => void;
}) {
  const selectedPresets = presets.filter((preset) => selectedIds.includes(preset.id));
  const summary = selectedPresets.length > 0
    ? selectedPresets.map((preset) => preset.label).join(", ")
    : "제외 없음";

  return (
    <div className="relative z-30 mb-3">
      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-panel sm:min-h-11 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-slate-500">
            <SlidersHorizontal size={14} className="text-slate-700" />
            일반 룰 제외
          </span>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          className={`grid h-10 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border px-3 text-sm font-black transition ${
          excludedRuleCount > 0
            ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
        }`}
        >
          <span className="min-w-0 truncate text-left">{summary}</span>
          <span className="inline-flex items-center gap-1.5">
            {excludedRuleCount > 0 ? `${excludedRuleCount}개 제외` : "선택"}
            <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 rounded-lg border border-slate-200 bg-white p-2 shadow-soft">
          <div className="grid gap-1 sm:grid-cols-2">
            {presets.map((preset) => {
              const checked = selectedIds.includes(preset.id);
              return (
                <label
                  key={preset.id}
                  className={`flex cursor-pointer gap-2 rounded-md px-3 py-2.5 transition ${
                    checked
                      ? "bg-blue-50 text-blue-950"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(preset.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-black">{preset.label}</span>
                    <span className={`mt-0.5 block text-xs font-semibold leading-5 ${checked ? "text-blue-800" : "text-slate-500"}`}>
                      {preset.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="truncate font-black text-slate-900">{value}</dd>
    </div>
  );
}

function UploadAudit({ audit }: { audit: SelectionAudit }) {
  const ignoredTone = audit.ignored > 0 ? "text-amber-700" : "text-slate-500";

  return (
    <div className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-3">
      <AuditItem label={audit.source} value={`${audit.total}개 확인`} />
      <AuditItem label="분석 포함" value={`${audit.accepted}개`} className="text-emerald-700" />
      <AuditItem label="제외" value={`${audit.ignored}개`} className={ignoredTone} />
      <p className="sm:col-span-3 text-xs font-semibold leading-5 text-slate-500">
        node_modules, build, dist, target 같은 생성물은 제외하고 코드/설정/의존성 파일만 분석합니다.
      </p>
    </div>
  );
}

function AuditItem({ label, value, className = "text-slate-900" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-black ${className}`}>{value}</p>
    </div>
  );
}

function AnalysisProgress({ fileCount, lineCount, startedAt }: { fileCount: number; lineCount: number; startedAt: string }) {
  return (
    <div role="status" aria-live="polite" className="mt-4 overflow-hidden rounded-lg border border-blue-200 bg-blue-50 shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-panel">
            <Loader2 size={20} className="animate-spin" />
          </div>
          <div>
            <p className="text-sm font-black text-blue-950">프로젝트 건강검진 진행 중</p>
            <p className="mt-1 text-sm font-semibold text-blue-800">
              {fileCount}개 파일 · {lineCount}줄 · {startedAt || "방금"} 접수
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-black text-blue-700">
          <Activity size={13} />
          LIVE
        </span>
      </div>

      <div className="px-4 pb-4">
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full w-2/3 rounded-full bg-blue-600 shadow-sm transition-all duration-700 ease-out animate-pulse" />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <ProgressStep status="done" label="대상 접수" />
          <ProgressStep status="active" label="룰셋 검사" />
          <ProgressStep status="pending" label="결과 생성" />
        </div>
        <p className="mt-3 text-xs font-semibold text-blue-700">
          무료 서버 첫 요청은 잠시 깨어나는 시간이 필요할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function ProgressStep({ status, label }: { status: "done" | "active" | "pending"; label: string }) {
  const active = status === "active";
  const done = status === "done";

  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-black ${
      done
        ? "border-blue-200 bg-white text-blue-800"
        : active
          ? "border-blue-300 bg-white text-blue-900 shadow-sm"
          : "border-blue-100 bg-blue-50 text-blue-500"
    }`}>
      {done ? <CheckCircle2 size={14} /> : active ? <Loader2 size={14} className="animate-spin" /> : <span className="h-2 w-2 rounded-full bg-blue-200" />}
      {label}
    </div>
  );
}

function CompletionNotice({ fileCount }: { fileCount: number }) {
  return (
    <div role="status" aria-live="polite" className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
        <CheckCircle2 size={16} />
      </div>
      <div>
        <p className="text-sm font-black text-emerald-950">건강검진 결과가 생성되었습니다.</p>
        <p className="mt-1 text-sm font-semibold text-emerald-800">
          {fileCount}개 파일 분석을 마쳤고, 아래 결과 화면으로 이동합니다.
        </p>
      </div>
    </div>
  );
}

type PickerStateProps = {
  icon: typeof FileCode2;
  title: string;
  meta: string;
  buttonLabel: string;
  disabled?: boolean;
  onClick: () => void;
};

function PickerState({ icon: Icon, title, meta, buttonLabel, disabled, onClick }: PickerStateProps) {
  return (
    <div className="grid h-[430px] place-items-center bg-white px-6">
      <div className="text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
          <Icon size={21} />
        </div>
        <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{meta}</p>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:bg-slate-300"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

type GithubStateProps = {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

function GithubState({ value, loading, onChange, onSubmit }: GithubStateProps) {
  return (
    <div className="grid h-[430px] place-items-center bg-white px-6">
      <form
        className="w-full max-w-xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
          <Github size={21} />
        </div>
        <h2 className="mt-4 text-center text-lg font-black text-slate-950">GitHub 저장소</h2>
        <p className="mt-1 text-center text-sm font-semibold text-slate-500">
          공개 저장소와 /tree/브랜치/하위폴더 URL을 지원합니다.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://github.com/owner/repository"
            className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            저장소 읽기
          </button>
        </div>
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
          private 저장소 인증과 대용량 clone 분석은 다음 단계입니다. 큰 저장소가 느리면 ZIP 업로드가 더 안정적입니다.
        </div>
      </form>
    </div>
  );
}
