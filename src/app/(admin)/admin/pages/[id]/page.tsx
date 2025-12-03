import { notFound } from "next/navigation";
import { getFlxblClient } from "@/lib/flxbl/config";
import {
  getAllPages,
  getPageParent,
  getPageLayout,
  getPageFilterCategories,
  getPageSections,
  getSectionContent,
} from "@/lib/flxbl/pages";
import { getAllCategoriesWithParent, getPublishedContent } from "@/lib/flxbl/queries";
import { PageForm } from "@/components/admin/page-form";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = getFlxblClient();

  // Fetch page and check if it exists
  let page;
  try {
    page = await client.get("Page", id);
  } catch {
    notFound();
  }

  // Fetch related data in parallel
  const [pages, layouts, categories, parent, layout, filterCategories, sections, globalBlocks, publishedContent] =
    await Promise.all([
      getAllPages(client),
      client.list("Layout"),
      getAllCategoriesWithParent(client),
      getPageParent(client, id),
      getPageLayout(client, id),
      getPageFilterCategories(client, id),
      getPageSections(client, id),
      client.list("Block"),
      getPublishedContent(client),
    ]);

  // Add parentId to pages (fetch from relationships)
  const pagesWithParent = await Promise.all(
    pages.map(async (p) => {
      const rels = await client.getRelationships(
        "Page",
        p.id,
        "PAGE_PARENT",
        "out",
        "Page"
      );
      return {
        ...p,
        parentId: rels[0]?.target.id ?? null,
      };
    })
  );

  // Enrich sections with content IDs
  const sectionsWithContent = await Promise.all(
    sections.map(async (section) => {
      const contentItems = await getSectionContent(client, section.id);
      return {
        ...section,
        contentIds: contentItems.map((c) => c.content.id),
      };
    })
  );

  const pageWithRelations = {
    ...page,
    parentId: parent?.id ?? null,
    layoutId: layout?.id ?? null,
    categoryIds: filterCategories.map((c) => c.id),
  };

  return (
    <PageForm
      page={pageWithRelations}
      pages={pagesWithParent}
      layouts={layouts}
      categories={categories}
      sections={sectionsWithContent}
      globalBlocks={globalBlocks}
      allContent={publishedContent}
    />
  );
}

