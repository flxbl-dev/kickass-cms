"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageTree } from "@/components/admin/page-tree";
import { toast } from "sonner";
import { Plus, FileText, Loader2 } from "lucide-react";
import type { Page } from "@/lib/flxbl/types";

// =============================================================================
// Types
// =============================================================================

interface PageWithParent extends Page {
  parentId: string | null;
}

// =============================================================================
// Delete Confirmation Dialog
// =============================================================================

function DeletePageDialog({
  page,
  open,
  onOpenChange,
  onConfirm,
}: {
  page: PageWithParent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!page) return;
    setDeleting(true);
    try {
      await onConfirm(page.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!page) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Page</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{page.title}&quot;? This will
            also delete all page sections.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Pages Admin Page
// =============================================================================

export default function PagesAdminPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PageWithParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletePage, setDeletePage] = useState<PageWithParent | null>(null);

  // Fetch pages on mount
  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/admin/pages");
      if (response.ok) {
        const data = await response.json();
        setPages(data);
      }
    } catch (error) {
      console.error("Failed to fetch pages:", error);
      toast.error("Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    router.push("/admin/pages/new");
  };

  const handleEdit = (page: PageWithParent) => {
    router.push(`/admin/pages/${page.id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/pages/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete");
      }

      setPages((prev) => prev.filter((p) => p.id !== id));
      toast.success("Page deleted successfully");
    } catch (error) {
      console.error("Failed to delete page:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete page");
      throw error;
    }
  };

  // Count stats
  const publishedCount = pages.filter((p) => p.isPublished).length;
  const draftCount = pages.filter((p) => !p.isPublished).length;
  const rootCount = pages.filter((p) => !p.parentId).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">
            Manage your site pages and navigation structure.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Create Page
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{draftCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Root Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rootCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Page Tree */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Page Structure</CardTitle>
          </CardHeader>
          <CardContent>
            {pages.length > 0 ? (
              <PageTree
                pages={pages}
                onEdit={handleEdit}
                onDelete={setDeletePage}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="size-12 mx-auto mb-4 opacity-50" />
                <p>No pages yet.</p>
                <Button className="mt-4" onClick={handleCreate}>
                  <Plus className="mr-2 size-4" />
                  Create your first page
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <DeletePageDialog
        page={deletePage}
        open={!!deletePage}
        onOpenChange={(open) => !open && setDeletePage(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

