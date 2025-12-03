import { getFlxblClient } from "@/lib/flxbl/config";
import { getAllPages } from "@/lib/flxbl/pages";
import { getAllCategoriesWithParent } from "@/lib/flxbl/queries";
import { PageForm } from "@/components/admin/page-form";

export default async function NewPagePage() {
  const client = getFlxblClient();

  // Fetch data in parallel
  const [pages, layouts, categories] = await Promise.all([
    getAllPages(client),
    client.list("Layout"),
    getAllCategoriesWithParent(client),
  ]);

  // Add parentId to pages (fetch from relationships)
  const pagesWithParent = await Promise.all(
    pages.map(async (page) => {
      const rels = await client.getRelationships(
        "Page",
        page.id,
        "PAGE_PARENT",
        "out",
        "Page"
      );
      return {
        ...page,
        parentId: rels[0]?.target.id ?? null,
      };
    })
  );

  return (
    <PageForm
      pages={pagesWithParent}
      layouts={layouts}
      categories={categories}
    />
  );
}

