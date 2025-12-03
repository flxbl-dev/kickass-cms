"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History, RotateCcw, Loader2, Clock, User, FileText } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ContentRevision, Author } from "@/lib/flxbl/types";

// =============================================================================
// Types
// =============================================================================

interface RevisionWithAuthor extends ContentRevision {
  author?: Author;
}

interface RevisionHistoryProps {
  contentId: string;
}

// =============================================================================
// Revision History Component
// =============================================================================

export function RevisionHistory({ contentId }: RevisionHistoryProps) {
  const router = useRouter();
  const [revisions, setRevisions] = useState<RevisionWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreTarget, setRestoreTarget] = useState<RevisionWithAuthor | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    async function fetchRevisions() {
      try {
        const response = await fetch(`/api/admin/content/${contentId}/revisions`);
        if (response.ok) {
          const data = await response.json();
          setRevisions(data);
        }
      } catch (error) {
        console.error("Failed to fetch revisions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRevisions();
  }, [contentId]);

  const handleRestore = async () => {
    if (!restoreTarget) return;

    setIsRestoring(true);
    try {
      const response = await fetch(`/api/admin/content/${contentId}/revisions/${restoreTarget.id}/restore`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to restore revision");
      }

      toast.success(`Restored to revision #${restoreTarget.revisionNumber}`);
      setRestoreTarget(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to restore revision:", error);
      toast.error(error instanceof Error ? error.message : "Failed to restore revision");
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" />
            Revisions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" />
            Revisions ({revisions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revisions.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {revisions.map((revision) => (
                  <div
                    key={revision.id}
                    className="flex items-start justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Revision #{revision.revisionNumber}
                        </span>
                        {revision.isCurrent && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(revision.createdAt)}
                        </span>
                        {revision.author && (
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {revision.author.name}
                          </span>
                        )}
                      </div>

                      {revision.changeMessage && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="size-3" />
                          {revision.changeMessage}
                        </p>
                      )}
                    </div>

                    {!revision.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRestoreTarget(revision)}
                        className="shrink-0"
                      >
                        <RotateCcw className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No revision history yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Revisions are created when you save changes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Revision</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore to revision #{restoreTarget?.revisionNumber}?
              This will replace the current content with the selected revision.
              A new revision will be created recording this restore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreTarget(null)}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 size-4" />
                  Restore
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

