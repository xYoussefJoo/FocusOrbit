'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileCode2, Folder, FolderOpen } from 'lucide-react';
import type { FileNode } from '@/lib/mockFileTree';

type Props = {
  nodes: FileNode[];
  activeId: string | null;
  onOpen: (node: FileNode) => void;
};

export function FileTree({ nodes, activeId, onOpen }: Props) {
  return (
    <ul role="tree" className="flex flex-col gap-px">
      {nodes.map((n) => (
        <TreeItem key={n.id} node={n} depth={0} activeId={activeId} onOpen={onOpen} />
      ))}
    </ul>
  );
}

function TreeItem({ node, depth, activeId, onOpen }: { node: FileNode; depth: number } & Omit<Props, 'nodes'>) {
  const [open, setOpen] = useState(depth === 0);
  const isFolder = node.type === 'folder';
  const active = node.id === activeId;
  const Chevron = open ? ChevronDown : ChevronRight;
  const FolderIcon = open ? FolderOpen : Folder;

  return (
    <li role="treeitem" aria-expanded={isFolder ? open : undefined} aria-selected={active}>
      <button
        onClick={() => (isFolder ? setOpen(!open) : onOpen(node))}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={`w-full h-7 pr-2 flex items-center gap-1.5 rounded-md text-[13px] text-left truncate transition-colors ${
          active ? 'bg-signal-soft text-ink font-semibold' : 'text-ink-muted hover:bg-raised hover:text-ink'
        }`}
      >
        {isFolder ? <Chevron className="size-3.5 shrink-0 text-ink-faint" /> : <span className="w-3.5 shrink-0" />}
        {isFolder ? (
          <FolderIcon className="size-4 shrink-0 text-ink-faint" />
        ) : (
          <FileCode2 className={`size-4 shrink-0 ${active ? 'text-signal' : 'text-ink-faint'}`} />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && open && node.children && (
        <ul role="group" className="flex flex-col gap-px">
          {node.children.map((c) => (
            <TreeItem key={c.id} node={c} depth={depth + 1} activeId={activeId} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </li>
  );
}
