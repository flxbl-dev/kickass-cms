"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthorForm } from "@/components/admin/author-form";
import { toast } from "sonner";
import { Plus, Users, Mail, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Author } from "@/lib/flxbl/types";

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
// Author Card
// =============================================================================

function AuthorCard({
  author,
  onEdit,
  onDelete,
}: {
  author: Author;
  onEdit: (author: Author) => void;
  onDelete: (author: Author) => void;
}) {
  return (
    <Card className="group">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="size-16">
            <AvatarImage src={author.avatarUrl ?? undefined} alt={author.name} />
            <AvatarFallback className="text-lg">
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg">{author.name}</h3>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  onClick={() => onEdit(author)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDelete(author)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Mail className="size-3.5" />
              <span className="truncate">{author.email}</span>
            </div>
            {author.bio && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {author.bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Delete Confirmation Dialog
// =============================================================================

function DeleteAuthorDialog({
  author,
  open,
  onOpenChange,
  onConfirm,
}: {
  author: Author | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!author) return;
    setDeleting(true);
    try {
      await onConfirm(author.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!author) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Author</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{author.name}&quot;? This action
            cannot be undone.
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
// Authors Page
// =============================================================================

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editAuthor, setEditAuthor] = useState<Author | null>(null);
  const [deleteAuthor, setDeleteAuthor] = useState<Author | null>(null);

  // Fetch authors on mount
  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const response = await fetch("/api/admin/authors");
      if (response.ok) {
        const data = await response.json();
        setAuthors(data);
      }
    } catch (error) {
      console.error("Failed to fetch authors:", error);
      toast.error("Failed to load authors");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditAuthor(null);
    setFormOpen(true);
  };

  const handleEdit = (author: Author) => {
    setEditAuthor(author);
    setFormOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    email: string;
    bio: string | null;
    avatarUrl: string | null;
  }) => {
    try {
      if (editAuthor) {
        // Update existing
        const response = await fetch(`/api/admin/authors/${editAuthor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update");
        }

        const updated = await response.json();
        setAuthors((prev) =>
          prev.map((a) => (a.id === editAuthor.id ? updated : a))
        );
        toast.success("Author updated successfully");
      } else {
        // Create new
        const response = await fetch("/api/admin/authors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create");
        }

        const created = await response.json();
        setAuthors((prev) => [...prev, created]);
        toast.success("Author created successfully");
      }
    } catch (error) {
      console.error("Failed to save author:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save author"
      );
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/authors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete");
      }

      setAuthors((prev) => prev.filter((a) => a.id !== id));
      toast.success("Author deleted successfully");
    } catch (error) {
      console.error("Failed to delete author:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete author"
      );
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Authors</h1>
          <p className="text-muted-foreground">
            Manage content creators and contributors.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Add Author
        </Button>
      </div>

      {/* Authors Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : authors.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {authors.map((author) => (
              <AuthorCard
                key={author.id}
                author={author}
                onEdit={handleEdit}
                onDelete={setDeleteAuthor}
              />
            ))}
          </div>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Author Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center">
                  <p className="text-3xl font-bold">{authors.length}</p>
                  <p className="text-sm text-muted-foreground">Total Authors</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {authors.filter((a) => a.bio).length}
                  </p>
                  <p className="text-sm text-muted-foreground">With Bio</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {authors.filter((a) => a.avatarUrl).length}
                  </p>
                  <p className="text-sm text-muted-foreground">With Avatar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="size-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No authors</h2>
            <p className="text-muted-foreground mt-2 text-center max-w-md">
              Add authors to attribute content to specific creators.
            </p>
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="mr-2 size-4" />
              Create your first author
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Author Form Dialog */}
      <AuthorForm
        author={editAuthor}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteAuthorDialog
        author={deleteAuthor}
        open={!!deleteAuthor}
        onOpenChange={(open) => !open && setDeleteAuthor(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
