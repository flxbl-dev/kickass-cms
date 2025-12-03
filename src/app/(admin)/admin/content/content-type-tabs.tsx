"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// =============================================================================
// Types
// =============================================================================

type ContentTypeFilter = "all" | "POST" | "ARTICLE" | "PAGE";

interface ContentTypeTabsProps {
  currentType: ContentTypeFilter;
  counts?: {
    all: number;
    POST: number;
    ARTICLE: number;
    PAGE: number;
  };
}

// =============================================================================
// Content Type Tabs Component
// =============================================================================

export function ContentTypeTabs({ currentType, counts }: ContentTypeTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset to page 1 when changing type
    params.delete("page");
    
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }

    const queryString = params.toString();
    router.push(`/admin/content${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <Tabs value={currentType} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="all">
          All
          {counts && <span className="ml-1.5 text-xs text-muted-foreground">({counts.all})</span>}
        </TabsTrigger>
        <TabsTrigger value="POST">
          Posts
          {counts && <span className="ml-1.5 text-xs text-muted-foreground">({counts.POST})</span>}
        </TabsTrigger>
        <TabsTrigger value="ARTICLE">
          Articles
          {counts && <span className="ml-1.5 text-xs text-muted-foreground">({counts.ARTICLE})</span>}
        </TabsTrigger>
        <TabsTrigger value="PAGE">
          Landing Content
          {counts && <span className="ml-1.5 text-xs text-muted-foreground">({counts.PAGE})</span>}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

