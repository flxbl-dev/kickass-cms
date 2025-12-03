"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

// =============================================================================
// Blog Post Error Boundary
// =============================================================================

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (replace with error tracking service in production)
    console.error("Blog post error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple Header - avoids server-only imports */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Kickass CMS</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Failed to load post
          </h1>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t load this blog post. This might be a temporary
            issue - please try again.
          </p>

          {/* Error Details (development only) */}
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="mb-6 p-4 bg-muted rounded-lg text-left">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground">
            Built with Next.js 16, Tailwind CSS v4, and{" "}
            <Link
              href="https://flxbl.dev"
              target="_blank"
              className="text-primary hover:underline"
            >
              FLXBL
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

