// Core client
export { createFlxblClient, FlxblError } from "./client";
export { getFlxblClient, getFlxblConfig } from "./config";
export type {
  FlxblConfig,
  FlxblClient,
  QueryFilter,
  QueryWhere,
  QueryTraversal,
  QueryOptions,
  ListOptions,
  RelationshipResult,
  PaginationInfo,
  ListResponse,
} from "./client";

// Types and schemas
export {
  // Entity schemas
  ContentSchema,
  AuthorSchema,
  CategorySchema,
  MediaSchema,
  ContentBlockSchema,
  ContentRevisionSchema,
  WorkflowStateSchema,
  LayoutSchema,
  LayoutPlacementSchema,
  BlockSchema,
  PageSchema,
  PageSectionSchema,
  // Create DTOs
  CreateContentSchema,
  CreateAuthorSchema,
  CreateCategorySchema,
  CreateMediaSchema,
  CreateContentBlockSchema,
  CreateContentRevisionSchema,
  CreateWorkflowStateSchema,
  CreateLayoutSchema,
  CreateLayoutPlacementSchema,
  CreateBlockSchema,
  CreatePageSchema,
  CreatePageSectionSchema,
  // Enums
  ContentTypeSchema,
  BlockTypeSchema,
  GlobalBlockTypeSchema,
  AuthorRoleSchema,
  MediaRoleSchema,
  PageSectionTypeSchema,
  // Relationship properties
  AuthoredByPropsSchema,
  CategorizedAsPropsSchema,
  HasMediaPropsSchema,
  HasBlockPropsSchema,
  HasStatePropsSchema,
  HasPlacementPropsSchema,
  StateTransitionPropsSchema,
  PageParentPropsSchema,
  CategoryParentPropsSchema,
  PageUsesLayoutPropsSchema,
  PageHasSectionPropsSchema,
  PageFiltersCategoryPropsSchema,
  SectionHasContentPropsSchema,
  // Page section config schemas
  ContentListConfigSchema,
  SingleContentConfigSchema,
  StaticBlockConfigSchema,
  // Block content schemas
  ParagraphContentSchema,
  HeadingContentSchema,
  ImageContentSchema,
  QuoteContentSchema,
  CodeContentSchema,
  CalloutContentSchema,
  EmbedContentSchema,
  ListContentSchema,
  DividerContentSchema,
  // Constants
  EntityNames,
  RelationshipNames,
  entitySchemas,
  relationshipPropSchemas,
} from "./types";

export type {
  // Entity types
  Content,
  Author,
  Category,
  Media,
  ContentBlock,
  ContentRevision,
  WorkflowState,
  Layout,
  LayoutPlacement,
  Block,
  Page,
  PageSection,
  // Create DTO types
  CreateContent,
  CreateAuthor,
  CreateCategory,
  CreateMedia,
  CreateContentBlock,
  CreateContentRevision,
  CreateWorkflowState,
  CreateLayout,
  CreateLayoutPlacement,
  CreateBlock,
  CreatePage,
  CreatePageSection,
  // Enum types
  ContentType,
  BlockType,
  GlobalBlockType,
  AuthorRole,
  MediaRole,
  PageSectionType,
  // Relationship property types
  AuthoredByProps,
  CategorizedAsProps,
  HasMediaProps,
  HasBlockProps,
  HasStateProps,
  HasPlacementProps,
  StateTransitionProps,
  PageParentProps,
  CategoryParentProps,
  PageUsesLayoutProps,
  PageHasSectionProps,
  PageFiltersCategoryProps,
  SectionHasContentProps,
  // Page section config types
  ContentListConfig,
  SingleContentConfig,
  StaticBlockConfig,
  // Block content types
  BlockContent,
  // Utility types
  EntityName,
  RelationshipName,
  EntityFromName,
  CreateDtoFromName,
  RelationshipPropsFromName,
  ContentWithRelations,
  PageWithRelations,
  CategoryWithRelations,
  PageSectionWithRelations,
  TypedContentBlock,
  ParagraphBlock,
  HeadingBlock,
  ImageBlock,
  QuoteBlock,
  CodeBlock,
  CalloutBlock,
  EmbedBlock,
  ListBlock,
  DividerBlock,
} from "./types";

// Query helpers
export {
  // Query builders
  whereSlug,
  whereHasTag,
  whereContentType,
  traverseAuthors,
  traverseMedia,
  traverseCategories,
  traverseBlocks,
  traverseState,
  // State queries
  getContentByState,
  getPublishedContent,
  getDraftContent,
  getWorkflowStates,
  getContentState,
  // Block queries
  getContentBlocks,
  getBlockMedia,
  getBlockAuthor,
  getBlockEmbeddedContent,
  // Revision queries
  getContentRevisions,
  getCurrentRevision,
  getRevisionAuthor,
  // Layout queries
  getLayouts,
  getContentLayout,
  // Content queries
  getContentBySlug,
  getContentWithPrimaryAuthor,
  getContentWithFeaturedImage,
  getContentAuthors,
  getContentMedia,
  getContentCategories,
  searchContentByTag,
  getContentWithRelations,
  listAllContent,
  // Category hierarchy queries
  getCategoryParent,
  getCategoryChildren,
  getRootCategories,
  setCategoryParent,
  getCategoryTree,
  getAllCategoriesWithParent,
} from "./queries";

export type { CategoryTreeNode } from "./queries";

// Block persistence
export {
  tiptapToBlocks,
  blocksToTiptap,
  saveContentBlocks,
  loadContentBlocks,
  loadContentAsTiptap,
} from "./blocks";

// Revision system
export {
  createRevision,
  getRevisions,
  getRevision,
  getCurrentRevision as getCurrentContentRevision,
  getRevisionAuthor as getContentRevisionAuthor,
  restoreRevision,
  compareRevisions,
} from "./revisions";

// Workflow management
export {
  getAllStates,
  getStateBySlug,
  getContentState as getContentWorkflowState,
  getAllowedTransitions,
  canTransitionTo,
  transitionState,
  getContentByState as getContentInState,
  countContentByState,
  validateTransition,
  validateTransitionAsync,
  getTransitionRules,
  getTransitionRulesAsync,
} from "./workflow";

export type { StateTransitionRule, TransitionValidation } from "./workflow";

// Layout system
export {
  getAllLayouts,
  getLayoutBySlug,
  getContentLayout as getLayoutForContent,
  setContentLayout,
  getContentPlacements,
  groupPlacementsByRegion,
  createPlacement,
  deletePlacement,
  updatePlacementPosition,
  getGlobalBlocks,
  getGlobalBlocksByType,
  LAYOUT_TEMPLATES,
} from "./layout";

export type { LayoutTemplate } from "./layout";

// Page management
export {
  // Page queries
  getPageByPath,
  getPageBySlug,
  getPublishedPages,
  getAllPages,
  // Page hierarchy
  getPageParent,
  getPageChildren,
  getRootPages,
  getPageAncestors,
  getNavigationTree,
  buildPagePath,
  setPageParent,
  // Page sections
  getPageSections,
  getSectionContent,
  getPageSectionsWithContent,
  // Page layout
  getPageLayout,
  setPageLayout,
  // Page category filters
  getPageFilterCategories,
  setPageFilterCategories,
  // Page with relations
  getPageWithRelations,
  getFilteredContentForPage,
} from "./pages";

export type { PageTreeNode } from "./pages";
