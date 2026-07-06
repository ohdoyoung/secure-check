import { AlertCircle, FileCode2, Folder, FolderOpen } from "lucide-react";
import type { ProjectTreeNode } from "../types/analysis";

export function ProjectTree({ tree }: { tree: ProjectTreeNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div>
        <p className="text-sm font-semibold text-slate-500">프로젝트 구조</p>
        <h2 className="mt-1 text-lg font-black text-slate-950">취약 파일 표시</h2>
      </div>
      <div className="scrollbar-thin mt-5 max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
        {tree.children.map((child) => (
          <TreeRow key={child.path || child.name} node={child} depth={0} />
        ))}
      </div>
    </section>
  );
}

function TreeRow({ node, depth }: { node: ProjectTreeNode; depth: number }) {
  const isDirectory = node.type === "directory";
  const Icon = isDirectory ? (node.vulnerable ? FolderOpen : Folder) : FileCode2;

  return (
    <div>
      <div
        className="grid h-9 grid-cols-[1fr_auto] items-center gap-3 rounded-md px-2 text-sm hover:bg-white"
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={16} className={node.vulnerable ? "shrink-0 text-red-600" : "shrink-0 text-slate-500"} />
          <span className={`truncate font-semibold ${node.vulnerable ? "text-slate-950" : "text-slate-600"}`}>{node.name}</span>
        </div>
        {node.severityCount.total > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-black text-red-700">
            <AlertCircle size={12} />
            {node.severityCount.total}
          </span>
        )}
      </div>
      {node.children.map((child) => (
        <TreeRow key={child.path || child.name} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}
