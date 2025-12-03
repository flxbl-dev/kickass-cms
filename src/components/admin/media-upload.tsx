"use client";

import { useState, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/flxbl/types";

// =============================================================================
// Types
// =============================================================================

interface MediaUploadProps {
  onUpload: (media: Media) => void;
  accept?: string;
  className?: string;
}

// =============================================================================
// Media Upload Component
// =============================================================================

export function MediaUpload({ onUpload, accept, className }: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Upload failed");
      }

      const media = await response.json();
      onUpload(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

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
        await handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleUpload(file);
      }
      // Reset input
      e.target.value = "";
    },
    [handleUpload]
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
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        className
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
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supports images (JPEG, PNG, GIF, WebP, SVG), videos (MP4, WebM), and documents (PDF)
          </p>
          {error && (
            <p className="text-xs text-destructive mb-4">{error}</p>
          )}
          <Input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id="media-upload-zone-input"
          />
          <Button asChild variant="outline" size="sm">
            <label htmlFor="media-upload-zone-input" className="cursor-pointer">
              Choose File
            </label>
          </Button>
        </>
      )}
    </div>
  );
}

