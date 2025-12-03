"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Category } from "@/lib/flxbl/types";

// =============================================================================
// Types
// =============================================================================

// Extended category type that includes parentId from API response
interface CategoryWithParent extends Category {
  parentId: string | null;
}

interface CategoryFormProps {
  category: CategoryWithParent | null;
  categories: CategoryWithParent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
  }) => Promise<void>;
}

// =============================================================================
// Helper Functions
// =============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// =============================================================================
// Category Form Dialog
// =============================================================================

export function CategoryForm({
  category,
  categories,
  open,
  onOpenChange,
  onSave,
}: CategoryFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  const isEditing = !!category;

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description ?? "");
      setParentId(category.parentId ?? null);
      setAutoSlug(false);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setParentId(null);
      setAutoSlug(true);
    }
  }, [category, open]);

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && !isEditing) {
      setSlug(slugify(name));
    }
  }, [name, autoSlug, isEditing]);

  const handleSlugChange = (value: string) => {
    setAutoSlug(false);
    setSlug(slugify(value));
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        parentId,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  // Filter out current category and its descendants from parent options
  const getValidParentOptions = () => {
    if (!category) return categories;

    const excludeIds = new Set<string>();
    excludeIds.add(category.id);

    // Find all descendants
    const findDescendants = (parentId: string) => {
      categories.forEach((cat) => {
        if (cat.parentId === parentId && !excludeIds.has(cat.id)) {
          excludeIds.add(cat.id);
          findDescendants(cat.id);
        }
      });
    };
    findDescendants(category.id);

    return categories.filter((cat) => !excludeIds.has(cat.id));
  };

  const validParents = getValidParentOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the category details below."
              : "Add a new category to organize your content."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="category-slug"
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier. Auto-generated from name.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Parent Category</Label>
            <Select
              value={parentId ?? "none"}
              onValueChange={(value) =>
                setParentId(value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Root Level)</SelectItem>
                {validParents.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim() || !slug.trim()}
          >
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

