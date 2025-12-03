import { z } from "zod";

// =============================================================================
// Entity Schemas - v3.0.0
// =============================================================================

// Content Types
export const ContentTypeSchema = z.enum(["PAGE", "POST", "ARTICLE"]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const ContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullish(),
  contentType: ContentTypeSchema,
  metadata: z.record(z.string(), z.unknown()).nullish(),
  publishedAt: z.coerce.date().nullish(),
  tags: z.array(z.string()).nullish(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Content = z.infer<typeof ContentSchema>;

// Author
export const AuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  bio: z.string().nullish(),
  avatarUrl: z.string().nullish(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Author = z.infer<typeof AuthorSchema>;

// Category (hierarchy managed via CATEGORY_PARENT relationship)
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Category = z.infer<typeof CategorySchema>;

// Media
export const MediaSchema = z.object({
  id: z.string(),
  filename: z.string(),
  url: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  alt: z.string().nullish(),
  caption: z.string().nullish(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Media = z.infer<typeof MediaSchema>;

// ContentBlock - Block-based content structure
export const BlockTypeSchema = z.enum([
  "PARAGRAPH",
  "HEADING",
  "IMAGE",
  "QUOTE",
  "CODE",
  "CALLOUT",
  "EMBED",
  "LIST",
  "DIVIDER",
]);
export type BlockType = z.infer<typeof BlockTypeSchema>;

// Block content schemas for each block type
export const ParagraphContentSchema = z.object({
  text: z.string(),
  format: z.enum(["plain", "markdown", "html"]).default("markdown"),
});

export const HeadingContentSchema = z.object({
  text: z.string(),
  level: z.number().int().min(1).max(6),
});

export const ImageContentSchema = z.object({
  caption: z.string().nullish(),
  alt: z.string().nullish(),
});

export const QuoteContentSchema = z.object({
  text: z.string(),
  attribution: z.string().nullish(),
});

export const CodeContentSchema = z.object({
  code: z.string(),
  language: z.string().nullish(),
  filename: z.string().nullish(),
});

export const CalloutContentSchema = z.object({
  text: z.string(),
  variant: z.enum(["info", "warning", "success", "error"]),
  title: z.string().nullish(),
});

export const EmbedContentSchema = z.object({
  displayStyle: z.enum(["card", "inline", "full"]),
});

export const ListContentSchema = z.object({
  items: z.array(z.string()),
  ordered: z.boolean().default(false),
});

export const DividerContentSchema = z.object({
  style: z.enum(["line", "dots", "space"]).default("line"),
});

// Union of all block content types
export const BlockContentSchema = z.union([
  ParagraphContentSchema,
  HeadingContentSchema,
  ImageContentSchema,
  QuoteContentSchema,
  CodeContentSchema,
  CalloutContentSchema,
  EmbedContentSchema,
  ListContentSchema,
  DividerContentSchema,
  z.record(z.string(), z.unknown()), // Fallback for unknown block types
]);
export type BlockContent = z.infer<typeof BlockContentSchema>;

export const ContentBlockSchema = z.object({
  id: z.string(),
  blockType: BlockTypeSchema,
  content: z.record(z.string(), z.unknown()), // JSON content specific to block type
  position: z.number().int(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ContentBlock = z.infer<typeof ContentBlockSchema>;

// ContentRevision - Version history
export const ContentRevisionSchema = z.object({
  id: z.string(),
  revisionNumber: z.number().int(),
  title: z.string(),
  blocksSnapshot: z.record(z.string(), z.unknown()), // JSON snapshot of blocks (object format per API)
  changeMessage: z.string().nullish(),
  isCurrent: z.boolean(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ContentRevision = z.infer<typeof ContentRevisionSchema>;

// WorkflowState - Content lifecycle states
export const WorkflowStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  color: z.string(),
  description: z.string().nullish(),
  position: z.number().int(),
  allowedTransitions: z.array(z.string()).nullish(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type WorkflowState = z.infer<typeof WorkflowStateSchema>;

// Layout - Page layout templates
// Region configuration stored as object per API spec
export const LayoutRegionConfigSchema = z.object({
  name: z.string(),
  maxBlocks: z.number().int().nullish(),
});

export const LayoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  regions: z.record(z.string(), z.unknown()), // Object format per API spec: { regionId: { name, maxBlocks } }
  template: z.string(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Layout = z.infer<typeof LayoutSchema>;

// LayoutPlacement - Content placement within layout regions
export const LayoutPlacementSchema = z.object({
  id: z.string(),
  region: z.string(),
  position: z.number().int(),
  settings: z.record(z.string(), z.unknown()).nullish(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type LayoutPlacement = z.infer<typeof LayoutPlacementSchema>;

// Block - Reusable global blocks
export const GlobalBlockTypeSchema = z.enum([
  "AUTHOR_BIO",
  "RELATED_POSTS",
  "NEWSLETTER",
  "CTA",
  "CUSTOM",
]);
export type GlobalBlockType = z.infer<typeof GlobalBlockTypeSchema>;

export const BlockSchema = z.object({
  id: z.string(),
  name: z.string(),
  blockType: GlobalBlockTypeSchema,
  content: z.record(z.string(), z.unknown()),
  isGlobal: z.boolean(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Block = z.infer<typeof BlockSchema>;

// Page - CMS pages with custom routes and layouts
export const PageSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  path: z.string(),
  description: z.string().nullish(),
  isPublished: z.boolean(),
  showInNav: z.boolean(),
  navOrder: z.number().int().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Page = z.infer<typeof PageSchema>;

// PageSection - Content sections within pages
export const PageSectionTypeSchema = z.enum([
  "CONTENT_LIST",
  "SINGLE_CONTENT",
  "STATIC_BLOCK",
  "GLOBAL_BLOCK",
]);
export type PageSectionType = z.infer<typeof PageSectionTypeSchema>;

// PageSection config schemas for each section type
export const ContentListConfigSchema = z.object({
  limit: z.number().int().default(10),
  orderBy: z.string().default("publishedAt"),
  orderDirection: z.enum(["ASC", "DESC"]).default("DESC"),
  contentType: z.enum(["PAGE", "POST", "ARTICLE"]).nullish(),
  showPagination: z.boolean().default(true),
});
export type ContentListConfig = z.infer<typeof ContentListConfigSchema>;

export const SingleContentConfigSchema = z.object({
  displayStyle: z.enum(["full", "card", "hero"]).default("full"),
});
export type SingleContentConfig = z.infer<typeof SingleContentConfigSchema>;

export const StaticBlockConfigSchema = z.object({
  blockType: z.string().nullish(),
});
export type StaticBlockConfig = z.infer<typeof StaticBlockConfigSchema>;

export const GlobalBlockConfigSchema = z.object({
  blockId: z.string().nullish(),
  blockType: z.enum(["AUTHOR_BIO", "RELATED_POSTS", "NEWSLETTER", "CTA", "CUSTOM"]).nullish(),
});
export type GlobalBlockConfig = z.infer<typeof GlobalBlockConfigSchema>;

export const PageSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  sectionType: PageSectionTypeSchema,
  config: z.record(z.string(), z.unknown()).nullish(),
  position: z.number().int(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type PageSection = z.infer<typeof PageSectionSchema>;

// =============================================================================
// Create DTOs (without id, createdAt, updatedAt)
// =============================================================================

export const CreateContentSchema = ContentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateContent = z.infer<typeof CreateContentSchema>;

export const CreateAuthorSchema = AuthorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateAuthor = z.infer<typeof CreateAuthorSchema>;

export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateCategory = z.infer<typeof CreateCategorySchema>;

export const CreateMediaSchema = MediaSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateMedia = z.infer<typeof CreateMediaSchema>;

export const CreateContentBlockSchema = ContentBlockSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateContentBlock = z.infer<typeof CreateContentBlockSchema>;

export const CreateContentRevisionSchema = ContentRevisionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateContentRevision = z.infer<typeof CreateContentRevisionSchema>;

export const CreateWorkflowStateSchema = WorkflowStateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateWorkflowState = z.infer<typeof CreateWorkflowStateSchema>;

export const CreateLayoutSchema = LayoutSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateLayout = z.infer<typeof CreateLayoutSchema>;

export const CreateLayoutPlacementSchema = LayoutPlacementSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateLayoutPlacement = z.infer<typeof CreateLayoutPlacementSchema>;

export const CreateBlockSchema = BlockSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateBlock = z.infer<typeof CreateBlockSchema>;

export const CreatePageSchema = PageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreatePage = z.infer<typeof CreatePageSchema>;

export const CreatePageSectionSchema = PageSectionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreatePageSection = z.infer<typeof CreatePageSectionSchema>;

// =============================================================================
// Relationship Property Schemas
// =============================================================================

export const AuthorRoleSchema = z.enum(["PRIMARY", "CONTRIBUTOR", "EDITOR"]);
export type AuthorRole = z.infer<typeof AuthorRoleSchema>;

export const MediaRoleSchema = z.enum([
  "FEATURED",
  "GALLERY",
  "INLINE",
  "ATTACHMENT",
]);
export type MediaRole = z.infer<typeof MediaRoleSchema>;

// AUTHORED_BY relationship properties
export const AuthoredByPropsSchema = z.object({
  role: AuthorRoleSchema,
  byline: z.string().nullish(),
});
export type AuthoredByProps = z.infer<typeof AuthoredByPropsSchema>;

// CATEGORIZED_AS relationship properties
export const CategorizedAsPropsSchema = z.object({
  featured: z.boolean().nullish(),
  position: z.number().nullish(),
});
export type CategorizedAsProps = z.infer<typeof CategorizedAsPropsSchema>;

// HAS_MEDIA relationship properties
export const HasMediaPropsSchema = z.object({
  role: MediaRoleSchema,
  position: z.number().nullish(),
  caption: z.string().nullish(),
});
export type HasMediaProps = z.infer<typeof HasMediaPropsSchema>;

// HAS_BLOCK relationship properties
export const HasBlockPropsSchema = z.object({
  position: z.number().int(),
});
export type HasBlockProps = z.infer<typeof HasBlockPropsSchema>;

// HAS_STATE relationship properties
export const HasStatePropsSchema = z.object({
  assignedAt: z.coerce.date(),
  assignedBy: z.string().nullish(),
});
export type HasStateProps = z.infer<typeof HasStatePropsSchema>;

// HAS_PLACEMENT relationship properties
export const HasPlacementPropsSchema = z.object({
  region: z.string(),
  position: z.number().int(),
});
export type HasPlacementProps = z.infer<typeof HasPlacementPropsSchema>;

// STATE_TRANSITION relationship properties
export const StateTransitionPropsSchema = z.object({
  requiresApproval: z.boolean().nullish(),
  notifyRoles: z.array(z.string()).nullish(),
});
export type StateTransitionProps = z.infer<typeof StateTransitionPropsSchema>;

// PAGE_PARENT relationship properties (empty - just links pages hierarchically)
export const PageParentPropsSchema = z.object({});
export type PageParentProps = z.infer<typeof PageParentPropsSchema>;

// CATEGORY_PARENT relationship properties (empty - just links categories hierarchically)
export const CategoryParentPropsSchema = z.object({});
export type CategoryParentProps = z.infer<typeof CategoryParentPropsSchema>;

// PAGE_USES_LAYOUT relationship properties
export const PageUsesLayoutPropsSchema = z.object({});
export type PageUsesLayoutProps = z.infer<typeof PageUsesLayoutPropsSchema>;

// PAGE_HAS_SECTION relationship properties
export const PageHasSectionPropsSchema = z.object({});
export type PageHasSectionProps = z.infer<typeof PageHasSectionPropsSchema>;

// PAGE_FILTERS_CATEGORY relationship properties
export const PageFiltersCategoryPropsSchema = z.object({});
export type PageFiltersCategoryProps = z.infer<typeof PageFiltersCategoryPropsSchema>;

// SECTION_HAS_CONTENT relationship properties
export const SectionHasContentPropsSchema = z.object({
  position: z.number().int().nullish(),
});
export type SectionHasContentProps = z.infer<typeof SectionHasContentPropsSchema>;

// SECTION_HAS_BLOCK relationship properties (for GLOBAL_BLOCK sections)
export const SectionHasBlockPropsSchema = z.object({});
export type SectionHasBlockProps = z.infer<typeof SectionHasBlockPropsSchema>;

// PAGE_HAS_PLACEMENT relationship properties (for placing global blocks in page layout regions)
export const PageHasPlacementPropsSchema = z.object({
  region: z.string(),
  position: z.number().int(),
});
export type PageHasPlacementProps = z.infer<typeof PageHasPlacementPropsSchema>;

// =============================================================================
// Entity and Relationship Type Maps
// =============================================================================

export const EntityNames = [
  "Content",
  "Author",
  "Category",
  "Media",
  "ContentBlock",
  "ContentRevision",
  "WorkflowState",
  "Layout",
  "LayoutPlacement",
  "Block",
  "Page",
  "PageSection",
] as const;
export type EntityName = (typeof EntityNames)[number];

export const RelationshipNames = [
  "AUTHORED_BY",
  "CATEGORIZED_AS",
  "HAS_MEDIA",
  "HAS_BLOCK",
  "HAS_REVISION",
  "REVISION_CREATED_BY",
  "HAS_STATE",
  "STATE_TRANSITION",
  "USES_LAYOUT",
  "HAS_PLACEMENT",
  "PAGE_HAS_PLACEMENT",
  "PLACEMENT_CONTAINS_BLOCK",
  "PLACEMENT_CONTAINS_CONTENT_BLOCK",
  "BLOCK_REFERENCES_MEDIA",
  "BLOCK_REFERENCES_CONTENT",
  "BLOCK_REFERENCES_AUTHOR",
  "PAGE_PARENT",
  "CATEGORY_PARENT",
  "PAGE_USES_LAYOUT",
  "PAGE_HAS_SECTION",
  "PAGE_FILTERS_CATEGORY",
  "SECTION_HAS_CONTENT",
  "SECTION_HAS_BLOCK",
] as const;
export type RelationshipName = (typeof RelationshipNames)[number];

// Map entity names to their schemas
export const entitySchemas = {
  Content: { schema: ContentSchema, createSchema: CreateContentSchema },
  Author: { schema: AuthorSchema, createSchema: CreateAuthorSchema },
  Category: { schema: CategorySchema, createSchema: CreateCategorySchema },
  Media: { schema: MediaSchema, createSchema: CreateMediaSchema },
  ContentBlock: { schema: ContentBlockSchema, createSchema: CreateContentBlockSchema },
  ContentRevision: { schema: ContentRevisionSchema, createSchema: CreateContentRevisionSchema },
  WorkflowState: { schema: WorkflowStateSchema, createSchema: CreateWorkflowStateSchema },
  Layout: { schema: LayoutSchema, createSchema: CreateLayoutSchema },
  LayoutPlacement: { schema: LayoutPlacementSchema, createSchema: CreateLayoutPlacementSchema },
  Block: { schema: BlockSchema, createSchema: CreateBlockSchema },
  Page: { schema: PageSchema, createSchema: CreatePageSchema },
  PageSection: { schema: PageSectionSchema, createSchema: CreatePageSectionSchema },
} as const;

// Map relationship names to their property schemas
export const relationshipPropSchemas = {
  AUTHORED_BY: AuthoredByPropsSchema,
  CATEGORIZED_AS: CategorizedAsPropsSchema,
  HAS_MEDIA: HasMediaPropsSchema,
  HAS_BLOCK: HasBlockPropsSchema,
  HAS_REVISION: z.object({}),
  REVISION_CREATED_BY: z.object({}),
  HAS_STATE: HasStatePropsSchema,
  STATE_TRANSITION: StateTransitionPropsSchema,
  USES_LAYOUT: z.object({}),
  HAS_PLACEMENT: HasPlacementPropsSchema,
  PAGE_HAS_PLACEMENT: PageHasPlacementPropsSchema,
  PLACEMENT_CONTAINS_BLOCK: z.object({}),
  PLACEMENT_CONTAINS_CONTENT_BLOCK: z.object({}),
  BLOCK_REFERENCES_MEDIA: z.object({}),
  BLOCK_REFERENCES_CONTENT: z.object({}),
  BLOCK_REFERENCES_AUTHOR: z.object({}),
  PAGE_PARENT: PageParentPropsSchema,
  CATEGORY_PARENT: CategoryParentPropsSchema,
  PAGE_USES_LAYOUT: PageUsesLayoutPropsSchema,
  PAGE_HAS_SECTION: PageHasSectionPropsSchema,
  PAGE_FILTERS_CATEGORY: PageFiltersCategoryPropsSchema,
  SECTION_HAS_CONTENT: SectionHasContentPropsSchema,
  SECTION_HAS_BLOCK: SectionHasBlockPropsSchema,
} as const;

// Type helper to get entity type from name
export type EntityFromName<T extends EntityName> = z.infer<
  (typeof entitySchemas)[T]["schema"]
>;

// Type helper to get create DTO type from entity name
export type CreateDtoFromName<T extends EntityName> = z.infer<
  (typeof entitySchemas)[T]["createSchema"]
>;

// Type helper to get relationship props from name
export type RelationshipPropsFromName<T extends RelationshipName> = z.infer<
  (typeof relationshipPropSchemas)[T]
>;

// =============================================================================
// Content with Relations Type (for queries)
// =============================================================================

export interface ContentWithRelations extends Content {
  _relationships?: {
    AUTHORED_BY?: Array<{
      target: Author;
      properties: AuthoredByProps;
    }>;
    HAS_MEDIA?: Array<{
      target: Media;
      properties: HasMediaProps;
    }>;
    CATEGORIZED_AS?: Array<{
      target: Category;
      properties: CategorizedAsProps;
    }>;
    HAS_BLOCK?: Array<{
      target: ContentBlock;
      properties: HasBlockProps;
    }>;
    HAS_STATE?: Array<{
      target: WorkflowState;
      properties: HasStateProps;
    }>;
    USES_LAYOUT?: Array<{
      target: Layout;
      properties: Record<string, unknown>;
    }>;
  };
}

// =============================================================================
// Page with Relations Type (for queries)
// =============================================================================

export interface PageWithRelations extends Page {
  _relationships?: {
    PAGE_PARENT?: Array<{
      target: Page;
      properties: PageParentProps;
    }>;
    PAGE_USES_LAYOUT?: Array<{
      target: Layout;
      properties: PageUsesLayoutProps;
    }>;
    PAGE_HAS_SECTION?: Array<{
      target: PageSection;
      properties: PageHasSectionProps;
    }>;
    PAGE_FILTERS_CATEGORY?: Array<{
      target: Category;
      properties: PageFiltersCategoryProps;
    }>;
  };
}

// =============================================================================
// Category with Relations Type (for hierarchy queries)
// =============================================================================

export interface CategoryWithRelations extends Category {
  _relationships?: {
    CATEGORY_PARENT?: Array<{
      target: Category;
      properties: CategoryParentProps;
    }>;
  };
  children?: CategoryWithRelations[];
}

// =============================================================================
// PageSection with Relations Type (for queries)
// =============================================================================

export interface PageSectionWithRelations extends PageSection {
  _relationships?: {
    SECTION_HAS_CONTENT?: Array<{
      target: Content;
      properties: SectionHasContentProps;
    }>;
  };
}

// =============================================================================
// Block Content Type Helpers
// =============================================================================

export type ParagraphBlock = ContentBlock & {
  blockType: "PARAGRAPH";
  content: z.infer<typeof ParagraphContentSchema>;
};

export type HeadingBlock = ContentBlock & {
  blockType: "HEADING";
  content: z.infer<typeof HeadingContentSchema>;
};

export type ImageBlock = ContentBlock & {
  blockType: "IMAGE";
  content: z.infer<typeof ImageContentSchema>;
};

export type QuoteBlock = ContentBlock & {
  blockType: "QUOTE";
  content: z.infer<typeof QuoteContentSchema>;
};

export type CodeBlock = ContentBlock & {
  blockType: "CODE";
  content: z.infer<typeof CodeContentSchema>;
};

export type CalloutBlock = ContentBlock & {
  blockType: "CALLOUT";
  content: z.infer<typeof CalloutContentSchema>;
};

export type EmbedBlock = ContentBlock & {
  blockType: "EMBED";
  content: z.infer<typeof EmbedContentSchema>;
};

export type ListBlock = ContentBlock & {
  blockType: "LIST";
  content: z.infer<typeof ListContentSchema>;
};

export type DividerBlock = ContentBlock & {
  blockType: "DIVIDER";
  content: z.infer<typeof DividerContentSchema>;
};

export type TypedContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | QuoteBlock
  | CodeBlock
  | CalloutBlock
  | EmbedBlock
  | ListBlock
  | DividerBlock;
