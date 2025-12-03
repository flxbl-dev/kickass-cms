"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaPicker } from "@/components/admin/media-picker";
import { Loader2, ImageIcon, X } from "lucide-react";
import type { Author, Media } from "@/lib/flxbl/types";

// =============================================================================
// Types
// =============================================================================

interface AuthorFormProps {
  author: Author | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    email: string;
    bio: string | null;
    avatarUrl: string | null;
  }) => Promise<void>;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// =============================================================================
// Author Form Dialog
// =============================================================================

export function AuthorForm({
  author,
  open,
  onOpenChange,
  onSave,
}: AuthorFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const isEditing = !!author;

  // Reset form when author changes
  useEffect(() => {
    if (author) {
      setName(author.name);
      setEmail(author.email);
      setBio(author.bio ?? "");
      setAvatarUrl(author.avatarUrl ?? null);
    } else {
      setName("");
      setEmail("");
      setBio("");
      setAvatarUrl(null);
    }
  }, [author, open]);

  const handleMediaSelect = (media: Media) => {
    setAvatarUrl(media.url);
    setMediaPickerOpen(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim() || null,
        avatarUrl,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Author" : "Create Author"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the author details below."
                : "Add a new author to attribute content to."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="size-20">
                  <AvatarImage src={avatarUrl ?? undefined} alt={name || "Avatar"} />
                  <AvatarFallback className="text-xl">
                    {name ? getInitials(name) : <ImageIcon className="size-8" />}
                  </AvatarFallback>
                </Avatar>
                {avatarUrl && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 size-6 p-0 rounded-full"
                    onClick={() => setAvatarUrl(null)}
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMediaPickerOpen(true)}
                >
                  {avatarUrl ? "Change Avatar" : "Upload Avatar"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Select from media library
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio about this author..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || !email.trim()}
            >
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Author"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Picker for Avatar */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        accept="image/*"
        title="Select Avatar"
        description="Choose an image for the author avatar."
      />
    </>
  );
}

