import { getFlxblClient } from "@/lib/flxbl/config";
import { ContentForm } from "../content-form";
import type { WorkflowState, Layout, Author, Category } from "@/lib/flxbl/types";

// =============================================================================
// Data Fetching
// =============================================================================

async function getFormData() {
  const client = getFlxblClient();

  try {
    const [states, layouts, authors, categories] = await Promise.all([
      client.list("WorkflowState", { orderBy: "position", orderDirection: "ASC" }),
      client.list("Layout"),
      client.list("Author"),
      client.list("Category"),
    ]);

    return { states, layouts, authors, categories };
  } catch (error) {
    console.error("Failed to fetch form data:", error);
    return {
      states: [] as WorkflowState[],
      layouts: [] as Layout[],
      authors: [] as Author[],
      categories: [] as Category[],
    };
  }
}

// =============================================================================
// New Content Page
// =============================================================================

export default async function NewContentPage() {
  const { states, layouts, authors, categories } = await getFormData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Content</h1>
        <p className="text-muted-foreground">
          Add a new page, post, or article to your site.
        </p>
      </div>

      {/* Content Form */}
      <ContentForm
        states={states}
        layouts={layouts}
        authors={authors}
        categories={categories}
      />
    </div>
  );
}

