import { notFound } from "next/navigation";
import { getFlxblClient } from "@/lib/flxbl/config";
import { loadContentAsTiptap } from "@/lib/flxbl/blocks";
import { ContentForm } from "../content-form";
import { RevisionHistory } from "@/components/admin/revision-history";

// =============================================================================
// Data Fetching
// =============================================================================

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getContentWithData(id: string) {
  const client = getFlxblClient();

  try {
    const [content, states, layouts, authors, categories] = await Promise.all([
      client.get("Content", id),
      client.list("WorkflowState", { orderBy: "position", orderDirection: "ASC" }),
      client.list("Layout"),
      client.list("Author"),
      client.list("Category"),
    ]);

    // Fetch current relationships and editor content
    const [authorRels, categoryRels, stateRels, layoutRels, editorContent] = await Promise.all([
      client.getRelationships("Content", id, "AUTHORED_BY", "out", "Author"),
      client.getRelationships("Content", id, "CATEGORIZED_AS", "out", "Category"),
      client.getRelationships("Content", id, "HAS_STATE", "out", "WorkflowState"),
      client.getRelationships("Content", id, "USES_LAYOUT", "out", "Layout"),
      loadContentAsTiptap(client, id),
    ]);

    return {
      content,
      states,
      layouts,
      authors,
      categories,
      currentAuthorId: authorRels[0]?.target?.id,
      currentCategoryIds: categoryRels.map((r) => r.target.id),
      currentStateId: stateRels[0]?.target?.id,
      currentLayoutId: layoutRels[0]?.target?.id,
      initialEditorContent: editorContent,
    };
  } catch (error) {
    console.error("Failed to fetch content:", error);
    return null;
  }
}

// =============================================================================
// Edit Content Page
// =============================================================================

export default async function EditContentPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getContentWithData(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Content</h1>
        <p className="text-muted-foreground">
          Modify the content and settings for this item.
        </p>
      </div>

      {/* Content Form with Revision History */}
      <ContentForm
        content={data.content}
        states={data.states}
        layouts={data.layouts}
        authors={data.authors}
        categories={data.categories}
        currentAuthorId={data.currentAuthorId}
        currentCategoryIds={data.currentCategoryIds}
        currentStateId={data.currentStateId}
        currentLayoutId={data.currentLayoutId}
        initialEditorContent={data.initialEditorContent}
        revisionHistorySlot={<RevisionHistory contentId={id} />}
      />
    </div>
  );
}

