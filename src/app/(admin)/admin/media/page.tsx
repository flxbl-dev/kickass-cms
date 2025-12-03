"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaUpload } from "@/components/admin/media-upload";
import { toast } from "sonner";
import {
  Upload,
  ImageIcon,
  FileVideo,
  FileText,
  File,
  Trash2,
  Pencil,
  Loader2,
  X,
} from "lucide-react";
import type { Media } from "@/lib/flxbl/types";

// =============================================================================
// Helper Functions
// =============================================================================

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("text/") || mimeType.includes("document"))
    return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =============================================================================
// Media Card Component
// =============================================================================

function MediaCard({
  media,
  onEdit,
  onDelete,
}: {
  media: Media;
  onEdit: (media: Media) => void;
  onDelete: (media: Media) => void;
}) {
  const Icon = getFileIcon(media.mimeType);
  const isImage = media.mimeType.startsWith("image/");

  return (
    <Card className="overflow-hidden group relative">
      <div className="aspect-square relative bg-muted">
        {isImage ? (
          <Image
            src={media.url}
            alt={media.alt ?? media.filename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="size-12 text-muted-foreground" />
          </div>
        )}
        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit(media)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(media)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="font-medium text-sm truncate" title={media.filename}>
          {media.filename}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {media.mimeType.split("/")[1]?.toUpperCase() ?? "FILE"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(media.size)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Edit Dialog Component
// =============================================================================

function EditMediaDialog({
  media,
  open,
  onOpenChange,
  onSave,
}: {
  media: Media | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: { alt: string; caption: string }) => Promise<void>;
}) {
  const [alt, setAlt] = useState(media?.alt ?? "");
  const [caption, setCaption] = useState(media?.caption ?? "");
  const [saving, setSaving] = useState(false);

  // Reset form when media changes
  useEffect(() => {
    if (media) {
      setAlt(media.alt ?? "");
      setCaption(media.caption ?? "");
    }
  }, [media]);

  const handleSave = async () => {
    if (!media) return;
    setSaving(true);
    try {
      await onSave(media.id, { alt, caption });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!media) return null;

  const isImage = media.mimeType.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Media</DialogTitle>
          <DialogDescription>
            Update the metadata for this media file.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Preview */}
          <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
            {isImage ? (
              <Image
                src={media.url}
                alt={media.alt ?? media.filename}
                fill
                className="object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {(() => {
                  const Icon = getFileIcon(media.mimeType);
                  return <Icon className="size-16 text-muted-foreground" />;
                })()}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Filename</p>
              <p className="text-sm text-muted-foreground">{media.filename}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Type</p>
              <p className="text-sm text-muted-foreground">{media.mimeType}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Size</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(media.size)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe the image..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Optional caption..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Delete Confirmation Dialog
// =============================================================================

function DeleteMediaDialog({
  media,
  open,
  onOpenChange,
  onConfirm,
}: {
  media: Media | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!media) return;
    setDeleting(true);
    try {
      await onConfirm(media.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Media</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{media.filename}&quot;? This action
            cannot be undone.
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
// Media Library Page
// =============================================================================

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [editMedia, setEditMedia] = useState<Media | null>(null);
  const [deleteMedia, setDeleteMedia] = useState<Media | null>(null);

  // Fetch media on mount
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await fetch("/api/admin/media");
      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (newMedia: Media) => {
    setMedia((prev) => [newMedia, ...prev]);
    setShowUpload(false);
    toast.success("File uploaded successfully");
  };

  const handleEdit = async (id: string, data: { alt: string; caption: string }) => {
    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updated = await response.json();
        setMedia((prev) =>
          prev.map((m) => (m.id === id ? updated : m))
        );
        toast.success("Media updated successfully");
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Failed to update media:", error);
      toast.error("Failed to update media");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== id));
        toast.success("Media deleted successfully");
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete media:", error);
      toast.error("Failed to delete media");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Manage your images, videos, and documents.
          </p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? (
            <>
              <X className="mr-2 size-4" />
              Cancel
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Upload
            </>
          )}
        </Button>
      </div>

      {/* Upload Zone */}
      {showUpload && (
        <MediaUpload onUpload={handleUpload} />
      )}

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : media.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onEdit={setEditMedia}
              onDelete={setDeleteMedia}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-lg">
          <ImageIcon className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No media files</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            Upload images, videos, or documents to use in your content.
          </p>
          <Button className="mt-4" onClick={() => setShowUpload(true)}>
            <Upload className="mr-2 size-4" />
            Upload your first file
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <EditMediaDialog
        media={editMedia}
        open={!!editMedia}
        onOpenChange={(open) => !open && setEditMedia(null)}
        onSave={handleEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteMediaDialog
        media={deleteMedia}
        open={!!deleteMedia}
        onOpenChange={(open) => !open && setDeleteMedia(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
