"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/flxbl/types";
import {
  Upload,
  ImageIcon,
  FileVideo,
  FileText,
  File,
  Check,
  Loader2,
  X,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: Media) => void;
  accept?: string;
  title?: string;
  description?: string;
}

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
// Media Grid Item
// =============================================================================

function MediaGridItem({
  media,
  selected,
  onSelect,
}: {
  media: Media;
  selected: boolean;
  onSelect: (media: Media) => void;
}) {
  const Icon = getFileIcon(media.mimeType);
  const isImage = media.mimeType.startsWith("image/");

  return (
    <button
      type="button"
      onClick={() => onSelect(media)}
      className={cn(
        "relative aspect-square rounded-lg border-2 overflow-hidden transition-all",
        "hover:ring-2 hover:ring-primary/50",
        selected
          ? "border-primary ring-2 ring-primary"
          : "border-transparent bg-muted"
      )}
    >
      {isImage ? (
        <Image
          src={media.url}
          alt={media.alt ?? media.filename}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 25vw, 15vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="size-8 text-muted-foreground" />
        </div>
      )}
      {selected && (
        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
          <div className="size-8 rounded-full bg-primary flex items-center justify-center">
            <Check className="size-5 text-primary-foreground" />
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="text-xs text-white truncate">{media.filename}</p>
      </div>
    </button>
  );
}

// =============================================================================
// Upload Zone
// =============================================================================

function UploadZone({
  onUpload,
  accept,
  isUploading,
}: {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  isUploading: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        await onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await onUpload(file);
      }
      // Reset input
      e.target.value = "";
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      )}
    >
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : (
        <>
          <Upload className="size-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-medium mb-1">
            Drag and drop a file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supports images, videos, and documents
          </p>
          <Input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id="media-upload-input"
          />
          <Button asChild variant="outline" size="sm">
            <label htmlFor="media-upload-input" className="cursor-pointer">
              Choose File
            </label>
          </Button>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Media Picker Dialog
// =============================================================================

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  accept,
  title = "Select Media",
  description = "Choose from your media library or upload a new file.",
}: MediaPickerProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Media | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch media on open
  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/media");
      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newMedia = await response.json();
        setMedia((prev) => [newMedia, ...prev]);
        setSelected(newMedia);
      }
    } catch (error) {
      console.error("Failed to upload:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
      setSelected(null);
    }
  };

  const filteredMedia = media.filter(
    (item) =>
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.alt && item.alt.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="library" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit">
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="mb-4">
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="flex-1 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMedia.length > 0 ? (
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pr-4">
                  {filteredMedia.map((item) => (
                    <MediaGridItem
                      key={item.id}
                      media={item}
                      selected={selected?.id === item.id}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="size-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No media found matching your search."
                      : "No media files yet. Upload one to get started."}
                  </p>
                </div>
              )}
            </ScrollArea>

            {selected && (
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-lg bg-muted overflow-hidden relative">
                    {selected.mimeType.startsWith("image/") ? (
                      <Image
                        src={selected.url}
                        alt={selected.alt ?? selected.filename}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {(() => {
                          const Icon = getFileIcon(selected.mimeType);
                          return <Icon className="size-6 text-muted-foreground" />;
                        })()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {selected.filename}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {selected.mimeType.split("/")[1]?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(selected.size)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(null)}
                  >
                    <X className="size-4 mr-1" />
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleConfirm}>
                    <Check className="size-4 mr-1" />
                    Select
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <UploadZone
              onUpload={handleUpload}
              accept={accept}
              isUploading={uploading}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

