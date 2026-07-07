import { AlertCircle, FileCode2, Folder, FolderOpen } from "lucide-react";
import type { ProjectTreeNode } from "../types/analysis";

type ProjectTreeProps = {
  tree: ProjectTreeNode;
  selectedFile?: string;
  onFileSelect?: (file: string) => void;
};

export function ProjectTree({ tree, selectedFile = "ALL", onFileSelect }: ProjectTreeProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div>
        <p className="text-sm font-semibold text-slate-500">프로젝트 구조</p>
        <h2 className="mt-1 text-lg font-black text-slate-950">취약 파일 표시</h2>
      </div>
      <div className="scrollbar-thin mt-5 max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
        {tree.children.map((child) => (
          <TreeRow key={child.path || child.name} node={child} depth={0} selectedFile={selectedFile} onFileSelect={onFileSelect} />
        ))}
      </div>
    </section>
  );
}

function TreeRow({
  node,
  depth,
  selectedFile,
  onFileSelect
}: {
  node: ProjectTreeNode;
  depth: number;
  selectedFile: string;
  onFileSelect?: (file: string) => void;
}) {
  const isDirectory = node.type === "directory";
  const Icon = isDirectory ? (node.vulnerable ? FolderOpen : Folder) : FileCode2;
  const active = !isDirectory && selectedFile === node.path;
  const rowClassName = `grid h-9 w-full grid-cols-[1fr_auto] items-center gap-3 rounded-md px-2 text-sm transition ${
    active
      ? "bg-slate-950 text-white shadow-panel"
      : isDirectory
        ? "text-slate-600"
        : "text-slate-700 hover:bg-white"
  }`;
  const rowStyle = { paddingLeft: `${depth * 18 + 8}px` };
  const rowContent = (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <Icon size={16} className={node.vulnerable ? `shrink-0 ${active ? "text-red-200" : "text-red-600"}` : `shrink-0 ${active ? "text-white" : "text-slate-500"}`} />
        <span className={`truncate font-semibold ${node.vulnerable ? active ? "text-white" : "text-slate-950" : active ? "text-white" : "text-slate-600"}`}>{node.name}</span>
      </div>
      {node.severityCount.total > 0 && (
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-black ${
          active ? "bg-white/15 text-white" : "bg-red-50 text-red-700"
        }`}>
          <AlertCircle size={12} />
          {node.severityCount.total}
        </span>
      )}
    </>
  );

  return (
    <div>
      {isDirectory || !onFileSelect ? (
        <div className={rowClassName} style={rowStyle}>
          {rowContent}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onFileSelect(node.path)}
          className={`${rowClassName} text-left`}
          style={rowStyle}
        >
          {rowContent}
        </button>
      )}
      {node.children.map((child) => (
        <TreeRow key={child.path || child.name} node={child} depth={depth + 1} selectedFile={selectedFile} onFileSelect={onFileSelect} />
      ))}
    </div>
  );
}
