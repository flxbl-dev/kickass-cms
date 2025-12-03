"use client";

import Link from "next/link";
import { X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

// =============================================================================
// Types
// =============================================================================

interface PreviewBannerProps {
  exitUrl?: string;
}

// =============================================================================
// Preview Banner Component
// =============================================================================

export function PreviewBanner({ exitUrl = "/api/preview/disable" }: PreviewBannerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 text-amber-950">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="size-5" />
            <span className="font-medium">
              Preview Mode Active
            </span>
            <span className="text-sm opacity-80">
              You are viewing unpublished content
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-amber-950 hover:text-amber-900 hover:bg-amber-400"
            asChild
          >
            <Link href={exitUrl}>
              <X className="size-4 mr-2" />
              Exit Preview
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

