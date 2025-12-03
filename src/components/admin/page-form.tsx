"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  ArrowLeft,
  Layers,
  FileText,
  LayoutGrid,
  Globe,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Page, Layout, Category, PageSection, Block, Content } from "@/lib/flxbl/types";
import { buildPagePath } from "@/lib/flxbl/pages";

// =============================================================================
// Types
// =============================================================================

interface PageWithRelations extends Page {
  parentId: string | null;
  layoutId: string | null;
  categoryIds: string[];
}

interface SectionWithContent extends PageSection {
  contentIds?: string[];
  blockId?: string;
}

interface PageFormProps {
  page?: PageWithRelations | null;
  pages: Array<Page & { parentId: string | null }>;
  layouts: Layout[];
  categories: Array<Category & { parentId: string | null }>;
  sections?: SectionWithContent[];
  globalBlocks?: Block[];
  allContent?: Content[];
}

type SectionType = "CONTENT_LIST" | "SINGLE_CONTENT" | "STATIC_BLOCK" | "GLOBAL_BLOCK";

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
// Section Display Helpers
// =============================================================================

function SectionTypeBadge({ type }: { type: string }) {
  const typeConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" }> = {
    CONTENT_LIST: { label: "Content List", icon: <LayoutGrid className="size-3" />, variant: "default" },
    SINGLE_CONTENT: { label: "Single Content", icon: <FileText className="size-3" />, variant: "secondary" },
    STATIC_BLOCK: { label: "Static Block", icon: <FileText className="size-3" />, variant: "outline" },
    GLOBAL_BLOCK: { label: "Global Block", icon: <Globe className="size-3" />, variant: "secondary" },
  };

  const config = typeConfig[type] ?? { label: type, icon: null, variant: "outline" as const };

  return (
    <Badge variant={config.variant} className="text-xs gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

function SectionConfigPreview({ config, type }: { config: Record<string, unknown>; type: string }) {
  if (type === "STATIC_BLOCK" && config.html) {
    const htmlContent = config.html as string;
    const preview = htmlContent.replace(/<[^>]*>/g, "").slice(0, 60).trim();
    return (
      <p className="text-xs text-muted-foreground truncate mt-1">
        {preview}...
      </p>
    );
  }

  if (type === "CONTENT_LIST") {
    const parts: string[] = [];
    if (config.limit) parts.push(`Limit: ${config.limit}`);
    if (config.contentType) parts.push(`Type: ${config.contentType}`);
    if (config.orderBy) parts.push(`Order: ${config.orderBy}`);
    if (parts.length > 0) {
      return (
        <p className="text-xs text-muted-foreground mt-1">
          {parts.join(" • ")}
        </p>
      );
    }
  }

  return null;
}

// =============================================================================
// Section Type Options
// =============================================================================

const SECTION_TYPE_OPTIONS: Array<{ value: SectionType; label: string; description: string; icon: React.ReactNode }> = [
  {
    value: "CONTENT_LIST",
    label: "Content List",
    description: "Display a grid of content items with filtering",
    icon: <LayoutGrid className="size-4" />,
  },
  {
    value: "SINGLE_CONTENT",
    label: "Single Content",
    description: "Display a specific piece of content",
    icon: <FileText className="size-4" />,
  },
  {
    value: "STATIC_BLOCK",
    label: "Static Block",
    description: "Custom HTML content block",
    icon: <FileText className="size-4" />,
  },
  {
    value: "GLOBAL_BLOCK",
    label: "Global Block",
    description: "Reusable global block (CTA, Newsletter, etc.)",
    icon: <Globe className="size-4" />,
  },
];

// =============================================================================
// Add Section Dialog
// =============================================================================

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { name: string; sectionType: SectionType; config?: Record<string, unknown> }) => void;
  globalBlocks?: Block[];
  allContent?: Content[];
}

function AddSectionDialog({ open, onOpenChange, onAdd, globalBlocks = [], allContent = [] }: AddSectionDialogProps) {
  const [name, setName] = useState("");
  const [sectionType, setSectionType] = useState<SectionType>("CONTENT_LIST");
  const [config, setConfig] = useState<Record<string, unknown>>({});

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Section name is required");
      return;
    }
    onAdd({ name: name.trim(), sectionType, config });
    setName("");
    setSectionType("CONTENT_LIST");
    setConfig({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
          <DialogDescription>
            Create a new content section for this page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Section Name</Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Featured Posts, Latest News"
            />
          </div>

          <div className="space-y-2">
            <Label>Section Type</Label>
            <div className="grid gap-2">
              {SECTION_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSectionType(option.value);
                    setConfig({});
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    sectionType === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className={`p-2 rounded-md ${sectionType === option.value ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {option.icon}
                  </div>
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Config options based on section type */}
          {sectionType === "CONTENT_LIST" && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Content List Settings</p>
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Limit</Label>
                  <Input
                    type="number"
                    min={1}
                    value={(config.limit as number) ?? 10}
                    onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value, 10) || 10 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Content Type</Label>
                  <Select
                    value={(config.contentType as string) ?? ""}
                    onValueChange={(v) => setConfig({ ...config, contentType: v || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="POST">Posts</SelectItem>
                      <SelectItem value="ARTICLE">Articles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Order By</Label>
                  <Select
                    value={(config.orderBy as string) ?? "publishedAt"}
                    onValueChange={(v) => setConfig({ ...config, orderBy: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publishedAt">Published Date</SelectItem>
                      <SelectItem value="updatedAt">Updated Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Direction</Label>
                  <Select
                    value={(config.orderDirection as string) ?? "DESC"}
                    onValueChange={(v) => setConfig({ ...config, orderDirection: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DESC">Newest First</SelectItem>
                      <SelectItem value="ASC">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {sectionType === "SINGLE_CONTENT" && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Single Content Settings</p>
              <div className="space-y-1">
                <Label className="text-xs">Display Style</Label>
                <Select
                  value={(config.displayStyle as string) ?? "full"}
                  onValueChange={(v) => setConfig({ ...config, displayStyle: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="hero">Hero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {allContent.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Select Content (optional)</Label>
                  <Select
                    value={(config.contentId as string) ?? ""}
                    onValueChange={(v) => setConfig({ ...config, contentId: v || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose content..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allContent.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {sectionType === "STATIC_BLOCK" && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Static Block Settings</p>
              <div className="space-y-1">
                <Label className="text-xs">HTML Content</Label>
                <Textarea
                  value={(config.html as string) ?? ""}
                  onChange={(e) => setConfig({ ...config, html: e.target.value })}
                  placeholder="<p>Your HTML content here...</p>"
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}

          {sectionType === "GLOBAL_BLOCK" && globalBlocks.length > 0 && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Global Block Settings</p>
              <div className="space-y-1">
                <Label className="text-xs">Select Block</Label>
                <Select
                  value={(config.blockId as string) ?? ""}
                  onValueChange={(v) => setConfig({ ...config, blockId: v || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a global block..." />
                  </SelectTrigger>
                  <SelectContent>
                    {globalBlocks.map((block) => (
                      <SelectItem key={block.id} value={block.id}>
                        {block.name} ({block.blockType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim()}>
            <Plus className="size-4 mr-2" />
            Add Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Edit Section Dialog
// =============================================================================

interface EditSectionDialogProps {
  section: SectionWithContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sectionId: string, data: { name?: string; config?: Record<string, unknown> }) => void;
  globalBlocks?: Block[];
  allContent?: Content[];
}

function EditSectionDialog({ section, open, onOpenChange, onSave, globalBlocks = [], allContent = [] }: EditSectionDialogProps) {
  const [name, setName] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (section) {
      setName(section.name);
      setConfig((section.config as Record<string, unknown>) ?? {});
    }
  }, [section]);

  const handleSave = () => {
    if (!section || !name.trim()) return;
    onSave(section.id, { name: name.trim(), config });
    onOpenChange(false);
  };

  if (!section) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
          <DialogDescription>
            Update section settings and configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-section-name">Section Name</Label>
            <Input
              id="edit-section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">Type:</Label>
            <SectionTypeBadge type={section.sectionType} />
          </div>

          {/* Config options based on section type */}
          {section.sectionType === "CONTENT_LIST" && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Content List Settings</p>
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Limit</Label>
                  <Input
                    type="number"
                    min={1}
                    value={(config.limit as number) ?? 10}
                    onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value, 10) || 10 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Content Type</Label>
                  <Select
                    value={(config.contentType as string) ?? ""}
                    onValueChange={(v) => setConfig({ ...config, contentType: v === "all" ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="POST">Posts</SelectItem>
                      <SelectItem value="ARTICLE">Articles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Order By</Label>
                  <Select
                    value={(config.orderBy as string) ?? "publishedAt"}
                    onValueChange={(v) => setConfig({ ...config, orderBy: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publishedAt">Published Date</SelectItem>
                      <SelectItem value="updatedAt">Updated Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Direction</Label>
                  <Select
                    value={(config.orderDirection as string) ?? "DESC"}
                    onValueChange={(v) => setConfig({ ...config, orderDirection: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DESC">Newest First</SelectItem>
                      <SelectItem value="ASC">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {section.sectionType === "SINGLE_CONTENT" && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Single Content Settings</p>
              <div className="space-y-1">
                <Label className="text-xs">Display Style</Label>
                <Select
                  value={(config.displayStyle as string) ?? "full"}
                  onValueChange={(v) => setConfig({ ...config, displayStyle: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="hero">Hero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {allContent.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Select Content</Label>
                  <Select
                    value={(config.contentId as string) ?? ""}
                    onValueChange={(v) => setConfig({ ...config, contentId: v || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose content..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allContent.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {section.sectionType === "STATIC_BLOCK" && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Static Block Settings</p>
              <div className="space-y-1">
                <Label className="text-xs">HTML Content</Label>
                <Textarea
                  value={(config.html as string) ?? ""}
                  onChange={(e) => setConfig({ ...config, html: e.target.value })}
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}

          {section.sectionType === "GLOBAL_BLOCK" && globalBlocks.length > 0 && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Global Block Settings</p>
              <div className="space-y-1">
                <Label className="text-xs">Select Block</Label>
                <Select
                  value={(config.blockId as string) ?? ""}
                  onValueChange={(v) => setConfig({ ...config, blockId: v || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a global block..." />
                  </SelectTrigger>
                  <SelectContent>
                    {globalBlocks.map((block) => (
                      <SelectItem key={block.id} value={block.id}>
                        {block.name} ({block.blockType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save className="size-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Page Form Component
// =============================================================================

export function PageForm({ page, pages, layouts, categories, sections: initialSections = [], globalBlocks = [], allContent = [] }: PageFormProps) {
  const router = useRouter();
  const isEditing = !!page;

  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [description, setDescription] = useState(page?.description ?? "");
  const [parentId, setParentId] = useState<string | null>(page?.parentId ?? null);
  const [layoutId, setLayoutId] = useState<string | null>(page?.layoutId ?? null);
  const [categoryIds, setCategoryIds] = useState<string[]>(page?.categoryIds ?? []);
  const [isPublished, setIsPublished] = useState(page?.isPublished ?? false);
  const [showInNav, setShowInNav] = useState(page?.showInNav ?? true);
  const [navOrder, setNavOrder] = useState(page?.navOrder ?? 0);
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  // Section editor state
  const [sections, setSections] = useState<SectionWithContent[]>(initialSections);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionWithContent | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingSection, setDeletingSection] = useState<SectionWithContent | null>(null);
  const [sectionSaving, setSectionSaving] = useState(false);

  // Compute path based on parent and slug
  const parentPage = pages.find((p) => p.id === parentId);
  const computedPath = buildPagePath(slug, parentPage?.path);

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && !isEditing) {
      setSlug(slugify(title));
    }
  }, [title, autoSlug, isEditing]);

  const handleSlugChange = (value: string) => {
    setAutoSlug(false);
    setSlug(slugify(value));
  };

  // Filter out current page and descendants from parent options
  const getValidParentOptions = () => {
    if (!page) return pages;

    const excludeIds = new Set<string>();
    excludeIds.add(page.id);

    // Find all descendants recursively
    const findDescendants = (parentId: string) => {
      pages.forEach((p) => {
        if (p.parentId === parentId && !excludeIds.has(p.id)) {
          excludeIds.add(p.id);
          findDescendants(p.id);
        }
      });
    };
    findDescendants(page.id);

    return pages.filter((p) => !excludeIds.has(p.id));
  };

  const validParents = getValidParentOptions();

  // =============================================================================
  // Section Management Functions
  // =============================================================================

  const handleAddSection = useCallback(async (data: { name: string; sectionType: SectionType; config?: Record<string, unknown> }) => {
    if (!page) return;

    setSectionSaving(true);
    try {
      const response = await fetch(`/api/admin/pages/${page.id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add section");
      }

      const newSection = await response.json();
      setSections((prev) => [...prev, newSection]);
      toast.success("Section added");
    } catch (error) {
      console.error("Failed to add section:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add section");
    } finally {
      setSectionSaving(false);
    }
  }, [page]);

  const handleUpdateSection = useCallback(async (sectionId: string, data: { name?: string; config?: Record<string, unknown> }) => {
    if (!page) return;

    setSectionSaving(true);
    try {
      const response = await fetch(`/api/admin/pages/${page.id}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update section");
      }

      const updatedSection = await response.json();
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? updatedSection : s))
      );
      toast.success("Section updated");
    } catch (error) {
      console.error("Failed to update section:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update section");
    } finally {
      setSectionSaving(false);
    }
  }, [page]);

  const handleDeleteSection = useCallback(async () => {
    if (!page || !deletingSection) return;

    setSectionSaving(true);
    try {
      const response = await fetch(
        `/api/admin/pages/${page.id}/sections?sectionId=${deletingSection.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete section");
      }

      setSections((prev) => prev.filter((s) => s.id !== deletingSection.id));
      setDeleteConfirmOpen(false);
      setDeletingSection(null);
      toast.success("Section deleted");
    } catch (error) {
      console.error("Failed to delete section:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete section");
    } finally {
      setSectionSaving(false);
    }
  }, [page, deletingSection]);

  const handleMoveSection = useCallback(async (sectionId: string, direction: "up" | "down") => {
    if (!page) return;

    const index = sections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    // Create new array with swapped positions
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];

    // Update positions
    const reorderedSections = newSections.map((s, i) => ({
      ...s,
      position: i,
    }));

    // Optimistic update
    setSections(reorderedSections);

    try {
      const response = await fetch(`/api/admin/pages/${page.id}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: reorderedSections.map((s) => ({ id: s.id, position: s.position })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reorder sections");
      }

      // Update with server response
      const updatedSections = await response.json();
      setSections(updatedSections);
    } catch (error) {
      // Revert on error
      setSections(sections);
      console.error("Failed to reorder sections:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reorder sections");
    }
  }, [page, sections]);

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        slug: slug.trim(),
        path: computedPath,
        description: description.trim() || null,
        parentId,
        layoutId,
        categoryIds,
        isPublished,
        showInNav,
        navOrder,
      };

      if (isEditing && page) {
        const response = await fetch(`/api/admin/pages/${page.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update page");
        }

        toast.success("Page updated successfully");
      } else {
        const response = await fetch("/api/admin/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create page");
        }

        toast.success("Page created successfully");
      }

      router.push("/admin/pages");
      router.refresh();
    } catch (error) {
      console.error("Failed to save page:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Edit Page" : "Create Page"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Update page settings and structure"
                : "Create a new page for your site"}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !title.trim() || !slug.trim()}>
          {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          <Save className="size-4 mr-2" />
          {isEditing ? "Save Changes" : "Create Page"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Page title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="page-slug"
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier. Auto-generated from title.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Full Path</Label>
                <Input value={computedPath} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  This will be the URL path for this page.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Meta description for SEO..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Filtering</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="layout">Layout</Label>
                <Select
                  value={layoutId ?? "none"}
                  onValueChange={(value) => setLayoutId(value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default Layout</SelectItem>
                    {layouts.map((layout) => (
                      <SelectItem key={layout.id} value={layout.id}>
                        {layout.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filter by Categories</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={categoryIds.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategoryIds([...categoryIds, category.id]);
                          } else {
                            setCategoryIds(categoryIds.filter((id) => id !== category.id));
                          }
                        }}
                        className="rounded border-input"
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No categories available
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Content on this page will be filtered by selected categories.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Page Sections Editor */}
          {isEditing && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="size-5" />
                      Page Sections
                    </CardTitle>
                    <CardDescription>
                      Manage content sections displayed on this page
                    </CardDescription>
                  </div>
                  <Button onClick={() => setAddSectionOpen(true)} size="sm">
                    <Plus className="size-4 mr-1" />
                    Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sections.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Layers className="size-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No content sections yet
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setAddSectionOpen(true)}>
                      <Plus className="size-4 mr-1" />
                      Add First Section
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sections.map((section, index) => (
                      <div
                        key={section.id}
                        className="group flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                      >
                        {/* Grip handle */}
                        <div className="text-muted-foreground/50">
                          <GripVertical className="size-4" />
                        </div>

                        {/* Position indicator */}
                        <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium shrink-0">
                          {index + 1}
                        </span>

                        {/* Section info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{section.name}</span>
                            <SectionTypeBadge type={section.sectionType} />
                          </div>
                          {section.config && Object.keys(section.config).length > 0 && (
                            <SectionConfigPreview config={section.config as Record<string, unknown>} type={section.sectionType} />
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleMoveSection(section.id, "up")}
                            disabled={index === 0}
                          >
                            <ChevronUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleMoveSection(section.id, "down")}
                            disabled={index === sections.length - 1}
                          >
                            <ChevronDown className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => {
                              setEditingSection(section);
                              setEditSectionOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingSection(section);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add Section Dialog */}
          <AddSectionDialog
            open={addSectionOpen}
            onOpenChange={setAddSectionOpen}
            onAdd={handleAddSection}
            globalBlocks={globalBlocks}
            allContent={allContent}
          />

          {/* Edit Section Dialog */}
          <EditSectionDialog
            section={editingSection}
            open={editSectionOpen}
            onOpenChange={(open) => {
              setEditSectionOpen(open);
              if (!open) setEditingSection(null);
            }}
            onSave={handleUpdateSection}
            globalBlocks={globalBlocks}
            allContent={allContent}
          />

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Section</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &ldquo;{deletingSection?.name}&rdquo;?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={sectionSaving}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteSection} disabled={sectionSaving}>
                  {sectionSaving ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hierarchy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Page</Label>
                <Select
                  value={parentId ?? "none"}
                  onValueChange={(value) => setParentId(value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Root Level)</SelectItem>
                    {validParents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.path} - {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Published</Label>
                  <p className="text-xs text-muted-foreground">
                    Make this page visible to the public
                  </p>
                </div>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show in Navigation</Label>
                  <p className="text-xs text-muted-foreground">
                    Include in site navigation menus
                  </p>
                </div>
                <Switch checked={showInNav} onCheckedChange={setShowInNav} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="navOrder">Navigation Order</Label>
                <Input
                  id="navOrder"
                  type="number"
                  value={navOrder}
                  onChange={(e) => setNavOrder(parseInt(e.target.value, 10) || 0)}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first in navigation
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

