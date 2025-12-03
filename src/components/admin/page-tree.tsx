"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page } from "@/lib/flxbl/types";

// =============================================================================
// Types
// =============================================================================

interface PageWithParent extends Page {
  parentId: string | null;
}

interface PageNode extends PageWithParent {
  children: PageNode[];
}

interface PageTreeProps {
  pages: PageWithParent[];
  onEdit: (page: PageWithParent) => void;
  onDelete: (page: PageWithParent) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildPageTree(pages: PageWithParent[]): PageNode[] {
  const pageMap = new Map<string, PageNode>();
  const roots: PageNode[] = [];

  // Initialize nodes
  for (const page of pages) {
    pageMap.set(page.id, { ...page, children: [] });
  }

  // Build tree
  for (const page of pages) {
    const node = pageMap.get(page.id)!;
    if (page.parentId && pageMap.has(page.parentId)) {
      pageMap.get(page.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort by navOrder
  const sortByNavOrder = (a: PageNode, b: PageNode) =>
    (a.navOrder ?? 0) - (b.navOrder ?? 0);

  roots.sort(sortByNavOrder);
  for (const node of pageMap.values()) {
    node.children.sort(sortByNavOrder);
  }

  return roots;
}

// =============================================================================
// Page Tree Item
// =============================================================================

interface PageTreeItemProps {
  page: PageNode;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (page: PageWithParent) => void;
  onDelete: (page: PageWithParent) => void;
}

function PageTreeItem({
  page,
  depth,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: PageTreeItemProps) {
  const router = useRouter();
  const hasChildren = page.children.length > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-3 rounded-md transition-colors group hover:bg-muted/50"
      )}
    >
      {/* Indent based on depth */}
      {depth > 0 && <div style={{ width: `${depth * 20}px` }} />}

      {/* Expand/Collapse */}
      {hasChildren ? (
        <button onClick={onToggle} className="p-0.5 hover:bg-muted rounded">
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </button>
      ) : (
        <div className="size-5" />
      )}

      {/* Icon & Title */}
      <FileText className="size-4 text-muted-foreground" />
      <span className="font-medium flex-1">{page.title}</span>

      {/* Status Badges */}
      {page.isPublished ? (
        <Eye className="size-3.5 text-green-500" />
      ) : (
        <EyeOff className="size-3.5 text-muted-foreground" />
      )}

      {/* Path Badge */}
      <Badge variant="secondary" className="text-xs font-mono">
        {page.path}
      </Badge>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={() => window.open(page.path, "_blank")}
          title="View page"
        >
          <ExternalLink className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={() => onEdit(page)}
          title="Edit page"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(page)}
          title="Delete page"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Page Tree Component
// =============================================================================

export function PageTree({ pages, onEdit, onDelete }: PageTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildPageTree(pages), [pages]);

  // Create flat list of visible items
  const flatItems = useMemo(() => {
    const result: Array<{ node: PageNode; depth: number }> = [];

    function traverse(items: PageNode[], depth: number) {
      for (const node of items) {
        result.push({ node, depth });
        if (node.children.length > 0 && expandedIds.has(node.id)) {
          traverse(node.children, depth + 1);
        }
      }
    }

    traverse(tree, 0);
    return result;
  }, [tree, expandedIds]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="size-12 mx-auto mb-4 opacity-50" />
        <p>No pages yet.</p>
        <p className="text-sm">Create your first page to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {flatItems.map(({ node, depth }) => (
        <PageTreeItem
          key={node.id}
          page={node}
          depth={depth}
          expanded={expandedIds.has(node.id)}
          onToggle={() => toggleExpanded(node.id)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

