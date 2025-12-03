import Link from "next/link";
import { getFlxblClient } from "@/lib/flxbl/config";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ContentTable } from "./content-table";
import { ContentPagination } from "./content-pagination";
import { ContentTypeTabs } from "./content-type-tabs";
import type { Content, WorkflowState, ContentType } from "@/lib/flxbl/types";

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_PAGE_SIZE = 20;

type ContentTypeFilter = "all" | ContentType;

// =============================================================================
// Data Fetching
// =============================================================================

interface ContentWithState extends Content {
  state?: WorkflowState;
}

interface PaginatedResult {
  content: ContentWithState[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ContentCounts {
  all: number;
  POST: number;
  ARTICLE: number;
  PAGE: number;
}

async function getContentCounts(): Promise<ContentCounts> {
  const client = getFlxblClient();

  try {
    const allContent = await client.list("Content");
    
    return {
      all: allContent.length,
      POST: allContent.filter((c) => c.contentType === "POST").length,
      ARTICLE: allContent.filter((c) => c.contentType === "ARTICLE").length,
      PAGE: allContent.filter((c) => c.contentType === "PAGE").length,
    };
  } catch (error) {
    console.error("Failed to fetch content counts:", error);
    return { all: 0, POST: 0, ARTICLE: 0, PAGE: 0 };
  }
}

async function getContentWithStates(
  page: number,
  pageSize: number,
  typeFilter: ContentTypeFilter
): Promise<PaginatedResult> {
  const client = getFlxblClient();

  try {
    // Fetch all content (we need to filter by type in memory since FLXBL list doesn't support where)
    const allContent = await client.list("Content", {
      orderBy: "updatedAt",
      orderDirection: "DESC",
    });

    // Filter by content type if specified
    const filteredContent =
      typeFilter === "all"
        ? allContent
        : allContent.filter((c) => c.contentType === typeFilter);

    const totalCount = filteredContent.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const paginatedContent = filteredContent.slice(offset, offset + pageSize);

    // Fetch workflow states for each content item
    const contentWithStates = await Promise.all(
      paginatedContent.map(async (item) => {
        try {
          const stateRels = await client.getRelationships(
            "Content",
            item.id,
            "HAS_STATE",
            "out",
            "WorkflowState"
          );
          return {
            ...item,
            state: stateRels[0]?.target,
          };
        } catch {
          return { ...item, state: undefined };
        }
      })
    );

    return {
      content: contentWithStates,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error("Failed to fetch content:", error);
    return {
      content: [],
      totalCount: 0,
      page: 1,
      pageSize,
      totalPages: 0,
    };
  }
}

// =============================================================================
// Content List Page
// =============================================================================

export default async function ContentListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = parseInt(params.pageSize ?? String(DEFAULT_PAGE_SIZE), 10);
  const typeFilter = (params.type as ContentTypeFilter) || "all";

  // Fetch content and counts in parallel
  const [{ content, totalCount, totalPages }, counts] = await Promise.all([
    getContentWithStates(page, pageSize, typeFilter),
    getContentCounts(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Manage your posts, articles, and landing content.
            {totalCount > 0 && (
              <span className="ml-2">
                Showing {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, totalCount)} of {totalCount}
              </span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/content/new">
            <Plus className="mr-2 size-4" />
            New Content
          </Link>
        </Button>
      </div>

      {/* Content Type Filter Tabs */}
      <ContentTypeTabs currentType={typeFilter} counts={counts} />

      {/* Content Table */}
      <ContentTable data={content} />

      {/* Pagination */}
      {totalPages > 1 && (
        <ContentPagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}
