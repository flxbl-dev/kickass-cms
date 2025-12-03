"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BlockEditor } from "@/components/editor";
import { getTransitionRules } from "@/lib/flxbl/workflow";
import type { Content, WorkflowState, Layout, Author, Category } from "@/lib/flxbl/types";

// =============================================================================
// Tiptap Types
// =============================================================================

interface TiptapDoc {
  type: "doc";
  content: TiptapNode[];
}

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

// =============================================================================
// Form Schema
// =============================================================================

const contentFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  excerpt: z.string().max(500, "Excerpt is too long").optional(),
  contentType: z.enum(["PAGE", "POST", "ARTICLE"]),
  tags: z.string().optional(),
  authorId: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  stateId: z.string().optional(),
  layoutId: z.string().optional(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

// =============================================================================
// Helper Functions
// =============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// =============================================================================
// Content Form Component
// =============================================================================

interface ContentFormProps {
  content?: Content;
  states: WorkflowState[];
  layouts: Layout[];
  authors: Author[];
  categories: Category[];
  currentAuthorId?: string;
  currentCategoryIds?: string[];
  currentStateId?: string;
  currentLayoutId?: string;
  initialEditorContent?: TiptapDoc;
  revisionHistorySlot?: React.ReactNode;
}

export function ContentForm({
  content,
  states,
  layouts,
  authors,
  categories,
  currentAuthorId,
  currentCategoryIds = [],
  currentStateId,
  currentLayoutId,
  initialEditorContent,
  revisionHistorySlot,
}: ContentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [editorJson, setEditorJson] = useState<TiptapDoc | null>(initialEditorContent ?? null);
  const isEditing = !!content;

  const handleEditorChange = useCallback((json: Record<string, unknown>) => {
    setEditorJson(json as unknown as TiptapDoc);
  }, []);

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: content?.title ?? "",
      slug: content?.slug ?? "",
      excerpt: content?.excerpt ?? "",
      contentType: content?.contentType ?? "POST",
      tags: content?.tags?.join(", ") ?? "",
      authorId: currentAuthorId ?? "",
      categoryIds: currentCategoryIds,
      stateId: currentStateId ?? states.find((s) => s.slug === "draft")?.id ?? "",
      layoutId: currentLayoutId ?? layouts[0]?.id ?? "",
    },
  });

  const watchTitle = form.watch("title");
  const watchStateId = form.watch("stateId");
  const watchContentType = form.watch("contentType");

  // Show author/categories for posts and articles, but not for landing content
  const showAuthorAndCategories = watchContentType !== "PAGE";

  // Compute allowed state transitions based on current state
  const currentState = useMemo(
    () => states.find((s) => s.id === currentStateId),
    [states, currentStateId]
  );

  const allowedTransitions = useMemo(() => {
    // For new content, all states are available
    if (!isEditing || !currentState) {
      return states;
    }

    // Get allowed transitions from the current state
    const rules = getTransitionRules(currentState.slug, states);
    const allowedSlugs = new Set(rules.map((r) => r.targetSlug));
    
    // Always include the current state
    allowedSlugs.add(currentState.slug);

    return states.filter((s) => allowedSlugs.has(s.slug));
  }, [isEditing, currentState, states]);

  const handleAutoSlug = () => {
    if (!isEditing && watchTitle) {
      form.setValue("slug", slugify(watchTitle));
    }
  };

  async function onSubmit(values: ContentFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch(
        isEditing ? `/api/admin/content/${content.id}` : "/api/admin/content",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            tags: values.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
            editorContent: editorJson,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save content");
      }

      const result = await response.json();
      toast.success(isEditing ? "Content updated" : "Content created");
      router.push(`/admin/content/${result.id}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to save content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save content");
    } finally {
      setIsLoading(false);
    }
  }

  const selectedState = states.find((s) => s.id === form.watch("stateId"));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter content title..."
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleAutoSlug();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="url-friendly-slug"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL path for this content (auto-generated from title)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the content..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Short summary shown in listings and search results
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="tag1, tag2, tag3"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of tags
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Block Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <BlockEditor
                  jsonContent={initialEditorContent}
                  placeholder="Start writing your content..."
                  onJsonChange={handleEditorChange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Publish
                  {selectedState && (
                    <Badge
                      style={{
                        backgroundColor: `${selectedState.color}20`,
                        color: selectedState.color,
                        borderColor: selectedState.color,
                      }}
                      variant="outline"
                    >
                      {selectedState.name}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="stateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <TooltipProvider>
                            {states.map((state) => {
                              const isAllowed = allowedTransitions.some((t) => t.id === state.id);
                              const isCurrent = state.id === currentStateId;
                              
                              if (!isAllowed && !isCurrent) {
                                return (
                                  <Tooltip key={state.id}>
                                    <TooltipTrigger asChild>
                                      <div className="relative flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5 text-sm opacity-50">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="size-2 rounded-full"
                                            style={{ backgroundColor: state.color }}
                                          />
                                          {state.name}
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Cannot transition from &ldquo;{currentState?.name}&rdquo; to &ldquo;{state.name}&rdquo;
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }

                              return (
                                <SelectItem key={state.id} value={state.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="size-2 rounded-full"
                                      style={{ backgroundColor: state.color }}
                                    />
                                    {state.name}
                                    {isCurrent && (
                                      <span className="text-xs text-muted-foreground">(current)</span>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </TooltipProvider>
                        </SelectContent>
                      </Select>
                      {isEditing && currentState && (
                        <FormDescription>
                          Allowed transitions from {currentState.name}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 size-4" />
                      {isEditing ? "Update" : "Create"} Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="POST">Post</SelectItem>
                          <SelectItem value="ARTICLE">Article</SelectItem>
                          <SelectItem value="PAGE">Landing Content</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === "POST" && "Blog posts appear in chronological feeds and support categories/tags."}
                        {field.value === "ARTICLE" && "Long-form articles with author attribution and categories."}
                        {field.value === "PAGE" && "Standalone landing pages with block-based content. For navigation pages, use Pages instead."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showAuthorAndCategories && (
                  <FormField
                    control={form.control}
                    name="authorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select author" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {authors.map((author) => (
                              <SelectItem key={author.id} value={author.id}>
                                {author.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="layoutId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Layout</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {layouts.map((layout) => (
                            <SelectItem key={layout.id} value={layout.id}>
                              {layout.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Categories - only for posts and articles */}
            {showAuthorAndCategories && (
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-input"
                            checked={form.watch("categoryIds")?.includes(category.id)}
                            onChange={(e) => {
                              const current = form.getValues("categoryIds") ?? [];
                              if (e.target.checked) {
                                form.setValue("categoryIds", [...current, category.id]);
                              } else {
                                form.setValue("categoryIds", current.filter((id) => id !== category.id));
                              }
                            }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No categories available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Revision History Slot */}
            {revisionHistorySlot}
          </div>
        </div>
      </form>
    </Form>
  );
}

