import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// Blog Post Loading State
// =============================================================================

export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Skeleton */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Back Link Skeleton */}
          <Skeleton className="h-4 w-28 mb-6" />

          {/* Post Header */}
          <header className="mb-8">
            {/* Category badges */}
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-3/4 mb-4" />

            {/* Excerpt */}
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-5/6 mb-6" />

            {/* Meta Info */}
            <div className="flex items-center gap-6">
              {/* Author */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              {/* Date */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </header>

          {/* Featured Image Skeleton */}
          <Skeleton className="aspect-video w-full rounded-lg mb-8" />

          {/* Content Skeleton */}
          <div className="space-y-4">
            {/* Paragraphs */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            <Skeleton className="h-8 w-2/3" /> {/* Heading */}

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>

            {/* Block quote skeleton */}
            <div className="border-l-4 border-muted pl-4 py-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          {/* Author Bio Skeleton */}
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* Footer Skeleton */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </footer>
    </div>
  );
}

