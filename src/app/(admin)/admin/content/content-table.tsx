"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/admin/data-table/data-table";
import type { Content, WorkflowState } from "@/lib/flxbl/types";

// =============================================================================
// Types
// =============================================================================

interface ContentWithState extends Content {
  state?: WorkflowState;
}

// =============================================================================
// Content Table Component
// =============================================================================

interface ContentTableProps {
  data: ContentWithState[];
}

export function ContentTable({ data }: ContentTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<ContentWithState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/content/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete content");
      }

      toast.success("Content deleted");
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete content");
    } finally {
      setIsDeleting(false);
    }
  };

  // =============================================================================
  // Column Definitions
  // =============================================================================

  const columns: ColumnDef<ContentWithState>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        const slug = row.original.slug;
        return (
          <div className="max-w-[300px]">
            <Link
              href={`/admin/content/${row.original.id}`}
              className="font-medium hover:underline"
            >
              {title}
            </Link>
            <p className="text-xs text-muted-foreground truncate">{slug}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "contentType",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("contentType") as string;
        const typeLabels: Record<string, string> = {
          POST: "Post",
          ARTICLE: "Article",
          PAGE: "Landing Content",
        };
        return (
          <Badge variant="outline">
            {typeLabels[type] ?? type.toLowerCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "state",
      header: "Status",
      cell: ({ row }) => {
        const state = row.original.state;
        if (!state) {
          return (
            <Badge variant="secondary" className="text-muted-foreground">
              No state
            </Badge>
          );
        }
        return (
          <Badge
            style={{
              backgroundColor: `${state.color}20`,
              color: state.color,
              borderColor: state.color,
            }}
            variant="outline"
          >
            {state.name}
          </Badge>
        );
      },
      filterFn: (row, _id, value) => {
        const state = row.original.state;
        if (!value || value === "all") return true;
        return state?.slug === value;
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Updated
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("updatedAt"));
        return (
          <span className="text-muted-foreground">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const content = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/content/${content.id}`}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/posts/${content.slug}`} target="_blank">
                  <Eye className="mr-2 size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteTarget(content)}
              >
                <Trash className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey="title"
        searchPlaceholder="Search content..."
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

