"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryTree } from "@/components/admin/category-tree";
import { toast } from "sonner";
import {
  Plus,
  FolderTree,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import type { Category } from "@/lib/flxbl/types";

// Extended category type that includes parentId from API response
interface CategoryWithParent extends Category {
  parentId: string | null;
}

// =============================================================================
// Delete Confirmation Dialog
// =============================================================================

function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
  onConfirm,
}: {
  category: CategoryWithParent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!category) return;
    setDeleting(true);
    try {
      await onConfirm(category.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{category.name}&quot;? This will
            remove the category from all associated content.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Categories Page
// =============================================================================

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryWithParent | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<CategoryWithParent | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (category: CategoryWithParent) => {
    setEditCategory(category);
    setFormOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
  }) => {
    try {
      if (editCategory) {
        // Update existing
        const response = await fetch(
          `/api/admin/categories/${editCategory.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update");
        }

        const updated = await response.json();
        setCategories((prev) =>
          prev.map((c) => (c.id === editCategory.id ? updated : c))
        );
        toast.success("Category updated successfully");
      } else {
        // Create new
        const response = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create");
        }

        const created = await response.json();
        setCategories((prev) => [...prev, created]);
        toast.success("Category created successfully");
      }
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save category"
      );
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete");
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category"
      );
      throw error;
    }
  };

  const handleReorder = async (updates: Array<{ id: string; parentId: string | null }>) => {
    try {
      const response = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reorder");
      }

      // Refresh categories
      await fetchCategories();
      toast.success("Category moved successfully");
    } catch (error) {
      console.error("Failed to reorder categories:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reorder categories"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your content with hierarchical categories.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Add Category
        </Button>
      </div>

      {/* Category Tree */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Category Tree</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Drag to reorder
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <CategoryTree
                  categories={categories}
                  onEdit={handleEdit}
                  onDelete={setDeleteCategory}
                  onReorder={handleReorder}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderTree className="size-12 mx-auto mb-4 opacity-50" />
                  <p>No categories yet.</p>
                  <Button className="mt-4" onClick={handleCreate}>
                    <Plus className="mr-2 size-4" />
                    Create your first category
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Categories ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category.slug}</Badge>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteCategory(category)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">
                    No categories available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Form Dialog */}
      <CategoryForm
        category={editCategory}
        categories={categories}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCategoryDialog
        category={deleteCategory}
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
