import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import { getPageSections, getSectionContent } from "@/lib/flxbl/pages";
import { ensureMutable, SystemContentError, createSystemContentResponse } from "@/lib/flxbl/guards";
import type { CreatePageSection } from "@/lib/flxbl/types";

// =============================================================================
// GET - List Page Sections
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pageId } = await params;
    const client = getFlxblClient();

    const sections = await getPageSections(client, pageId);

    // Get content for each section
    const sectionsWithContent = await Promise.all(
      sections.map(async (section) => {
        const contentItems = await getSectionContent(client, section.id);
        return {
          ...section,
          contentIds: contentItems.map((c) => c.content.id),
        };
      })
    );

    return NextResponse.json(sectionsWithContent);
  } catch (error) {
    console.error("Failed to list page sections:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to list page sections" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Page Section
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pageId } = await params;
    const body = await request.json();
    const client = getFlxblClient();

    // Validate required fields
    if (!body.name || !body.sectionType) {
      return NextResponse.json(
        { message: "Name and sectionType are required" },
        { status: 400 }
      );
    }

    // Get current sections to determine position
    const existingSections = await getPageSections(client, pageId);
    const maxPosition = existingSections.reduce(
      (max, s) => Math.max(max, s.position),
      -1
    );

    // Create section
    const sectionData: CreatePageSection = {
      name: body.name,
      sectionType: body.sectionType,
      config: body.config || null,
      position: body.position ?? maxPosition + 1,
    };

    const section = await client.create("PageSection", sectionData);

    // Create relationship to page
    await client.createRelationship(
      "Page",
      pageId,
      "PAGE_HAS_SECTION",
      section.id,
      {}
    );

    // Add content relationships if contentIds provided
    if (body.contentIds?.length > 0) {
      for (let i = 0; i < body.contentIds.length; i++) {
        await client.createRelationship(
          "PageSection",
          section.id,
          "SECTION_HAS_CONTENT",
          body.contentIds[i],
          { position: i }
        );
      }
    }

    return NextResponse.json({
      ...section,
      contentIds: body.contentIds || [],
    });
  } catch (error) {
    console.error("Failed to create page section:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create page section" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update Section or Bulk Reorder Sections
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pageId } = await params;
    const body = await request.json();
    const client = getFlxblClient();

    // Check if page is system/demo content
    await ensureMutable(client, "Page", pageId);

    // Handle bulk reorder: { sections: [{ id, position }] }
    if (body.sections && Array.isArray(body.sections)) {
      const updates = body.sections as Array<{ id: string; position: number }>;
      
      for (const update of updates) {
        await client.patch("PageSection", update.id, { position: update.position });
      }

      // Return updated sections
      const sections = await getPageSections(client, pageId);
      const sectionsWithContent = await Promise.all(
        sections.map(async (section) => {
          const contentItems = await getSectionContent(client, section.id);
          return {
            ...section,
            contentIds: contentItems.map((c) => c.content.id),
          };
        })
      );

      return NextResponse.json(sectionsWithContent);
    }

    // Handle single section update: { sectionId, ...updates }
    if (body.sectionId) {
      const { sectionId, ...updateData } = body;

      // Check if section is system/demo content
      await ensureMutable(client, "PageSection", sectionId);

      // Build update object
      const updates: Record<string, unknown> = {};
      if (updateData.name !== undefined) updates.name = updateData.name;
      if (updateData.sectionType !== undefined) updates.sectionType = updateData.sectionType;
      if (updateData.config !== undefined) updates.config = updateData.config;
      if (updateData.position !== undefined) updates.position = updateData.position;

      const section = await client.patch("PageSection", sectionId, updates);

      // Handle content relationship updates
      if (updateData.contentIds !== undefined) {
        // Remove existing content relationships
        const existingContent = await getSectionContent(client, sectionId);
        for (const { content } of existingContent) {
          await client.deleteRelationship(
            "PageSection",
            sectionId,
            "SECTION_HAS_CONTENT",
            content.id
          );
        }

        // Create new content relationships
        for (let i = 0; i < updateData.contentIds.length; i++) {
          await client.createRelationship(
            "PageSection",
            sectionId,
            "SECTION_HAS_CONTENT",
            updateData.contentIds[i],
            { position: i }
          );
        }
      }

      // Handle global block relationship for GLOBAL_BLOCK sections
      if (updateData.blockId !== undefined && section.sectionType === "GLOBAL_BLOCK") {
        // Remove existing block relationship
        const blockRels = await client.getRelationships(
          "PageSection",
          sectionId,
          "SECTION_HAS_BLOCK",
          "out",
          "Block"
        );
        for (const rel of blockRels) {
          await client.deleteRelationship(
            "PageSection",
            sectionId,
            "SECTION_HAS_BLOCK",
            rel.target.id
          );
        }

        // Create new block relationship if blockId provided
        if (updateData.blockId) {
          await client.createRelationship(
            "PageSection",
            sectionId,
            "SECTION_HAS_BLOCK",
            updateData.blockId,
            {}
          );
        }
      }

      const contentItems = await getSectionContent(client, sectionId);
      return NextResponse.json({
        ...section,
        contentIds: contentItems.map((c) => c.content.id),
      });
    }

    return NextResponse.json(
      { message: "Invalid request body. Provide either 'sections' array for reorder or 'sectionId' for update." },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("PageSection"), { status: 403 });
    }
    console.error("Failed to update page section(s):", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update page section(s)" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete a Section
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pageId } = await params;
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("sectionId");

    if (!sectionId) {
      return NextResponse.json(
        { message: "sectionId query parameter is required" },
        { status: 400 }
      );
    }

    const client = getFlxblClient();

    // Check if page is system/demo content
    await ensureMutable(client, "Page", pageId);

    // Check if section is system/demo content
    await ensureMutable(client, "PageSection", sectionId);

    // Remove content relationships
    const contentItems = await getSectionContent(client, sectionId);
    for (const { content } of contentItems) {
      await client.deleteRelationship(
        "PageSection",
        sectionId,
        "SECTION_HAS_CONTENT",
        content.id
      );
    }

    // Remove block relationships (for GLOBAL_BLOCK sections)
    const blockRels = await client.getRelationships(
      "PageSection",
      sectionId,
      "SECTION_HAS_BLOCK",
      "out",
      "Block"
    );
    for (const rel of blockRels) {
      await client.deleteRelationship(
        "PageSection",
        sectionId,
        "SECTION_HAS_BLOCK",
        rel.target.id
      );
    }

    // Remove page-section relationship
    await client.deleteRelationship("Page", pageId, "PAGE_HAS_SECTION", sectionId);

    // Delete the section entity
    await client.delete("PageSection", sectionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("PageSection"), { status: 403 });
    }
    console.error("Failed to delete page section:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete page section" },
      { status: 500 }
    );
  }
}

