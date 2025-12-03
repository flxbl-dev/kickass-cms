"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/flxbl/types";

// =============================================================================
// Types
// =============================================================================

// Extended category type that includes parentId from API response
interface CategoryWithParent extends Category {
  parentId: string | null;
}

interface CategoryNode extends CategoryWithParent {
  children: CategoryNode[];
}

interface CategoryTreeProps {
  categories: CategoryWithParent[];
  onEdit: (category: CategoryWithParent) => void;
  onDelete: (category: CategoryWithParent) => void;
  onReorder: (updates: Array<{ id: string; parentId: string | null }>) => Promise<void>;
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildCategoryTree(categories: CategoryWithParent[]): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  // Initialize nodes
  for (const cat of categories) {
    categoryMap.set(cat.id, { ...cat, children: [] });
  }

  // Build tree
  for (const cat of categories) {
    const node = categoryMap.get(cat.id)!;
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      categoryMap.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function flattenTree(nodes: CategoryNode[], parentId: string | null = null): Array<{ node: CategoryNode; parentId: string | null; depth: number }> {
  const result: Array<{ node: CategoryNode; parentId: string | null; depth: number }> = [];
  
  function traverse(items: CategoryNode[], parent: string | null, depth: number) {
    for (const node of items) {
      result.push({ node, parentId: parent, depth });
      if (node.children.length > 0) {
        traverse(node.children, node.id, depth + 1);
      }
    }
  }
  
  traverse(nodes, parentId, 0);
  return result;
}

// =============================================================================
// Sortable Category Item
// =============================================================================

interface SortableCategoryItemProps {
  category: CategoryNode;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (category: CategoryWithParent) => void;
  onDelete: (category: CategoryWithParent) => void;
  isDragging?: boolean;
}

function SortableCategoryItem({
  category,
  depth,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isDragging,
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = category.children.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 py-2 px-3 rounded-md transition-colors group",
        isSortableDragging && "opacity-50",
        isDragging && "bg-muted"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </button>

      {/* Indent based on depth */}
      {depth > 0 && (
        <div style={{ width: `${depth * 20}px` }} />
      )}

      {/* Expand/Collapse */}
      {hasChildren ? (
        <button
          onClick={onToggle}
          className="p-0.5 hover:bg-muted rounded"
        >
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </button>
      ) : (
        <div className="size-5" />
      )}

      {/* Icon & Name */}
      <FolderTree className="size-4 text-muted-foreground" />
      <span className="font-medium flex-1">{category.name}</span>

      {/* Slug Badge */}
      <Badge variant="secondary" className="text-xs">
        {category.slug}
      </Badge>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={() => onEdit(category)}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Drag Overlay Item
// =============================================================================

function DragOverlayItem({ category }: { category: CategoryNode }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-background border shadow-lg">
      <GripVertical className="size-4 text-muted-foreground" />
      <FolderTree className="size-4 text-muted-foreground" />
      <span className="font-medium">{category.name}</span>
      <Badge variant="secondary" className="text-xs">
        {category.slug}
      </Badge>
    </div>
  );
}

// =============================================================================
// Category Tree Component
// =============================================================================

export function CategoryTree({
  categories,
  onEdit,
  onDelete,
  onReorder,
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  
  // Create a flat list of visible items for sortable context
  const flatItems = useMemo(() => {
    const result: Array<{ node: CategoryNode; depth: number }> = [];
    
    function traverse(items: CategoryNode[], depth: number) {
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

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryNode>();
    function traverse(items: CategoryNode[]) {
      for (const node of items) {
        map.set(node.id, node);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      }
    }
    traverse(tree);
    return map;
  }, [tree]);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Find the indices
    const activeIndex = flatItems.findIndex((item) => item.node.id === active.id);
    const overIndex = flatItems.findIndex((item) => item.node.id === over.id);

    if (activeIndex === -1 || overIndex === -1) {
      return;
    }

    const activeItem = flatItems[activeIndex];
    const overItem = flatItems[overIndex];

    // Determine new parent based on depth
    // If dropping at same depth, use same parent as target
    // If dropping at higher depth, use target as parent
    let newParentId: string | null = null;

    if (overItem.depth === 0) {
      // Dropping at root level
      newParentId = null;
    } else {
      // Find the parent at the target position
      // Look backwards for an item with depth - 1
      for (let i = overIndex - 1; i >= 0; i--) {
        if (flatItems[i].depth === overItem.depth - 1) {
          newParentId = flatItems[i].node.id;
          break;
        }
      }
      
      // If same level, use same parent
      if (activeItem.depth === overItem.depth) {
        newParentId = overItem.node.parentId ?? null;
      }
    }

    // Only update if parent changed
    if (activeItem.node.parentId !== newParentId) {
      await onReorder([{ id: active.id as string, parentId: newParentId }]);
    }
  };

  const activeCategory = activeId ? categoryMap.get(activeId as string) : null;

  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FolderTree className="size-12 mx-auto mb-4 opacity-50" />
        <p>No categories yet.</p>
        <p className="text-sm">Create your first category to get started.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={flatItems.map((item) => item.node.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {flatItems.map(({ node, depth }) => (
            <SortableCategoryItem
              key={node.id}
              category={node}
              depth={depth}
              expanded={expandedIds.has(node.id)}
              onToggle={() => toggleExpanded(node.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              isDragging={activeId === node.id}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeCategory && <DragOverlayItem category={activeCategory} />}
      </DragOverlay>
    </DndContext>
  );
}

