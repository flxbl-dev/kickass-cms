import Link from "next/link";
import { Suspense } from "react";
import { getFlxblClient } from "@/lib/flxbl/config";
import { getNavigationTree, type PageTreeNode } from "@/lib/flxbl/pages";

// =============================================================================
// Types
// =============================================================================

interface SiteFooterProps {
  className?: string;
}

// =============================================================================
// Footer Navigation
// =============================================================================

async function FooterNavigation() {
  const client = getFlxblClient();
  
  let navTree: PageTreeNode[] = [];
  try {
    navTree = await getNavigationTree(client, true);
  } catch {
    return null;
  }

  const visiblePages = navTree.filter((page) => page.showInNav);

  if (visiblePages.length === 0) {
    return null;
  }

  return (
    <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
      {visiblePages.map((page) => (
        <Link
          key={page.id}
          href={page.path}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {page.title}
        </Link>
      ))}
    </nav>
  );
}

// =============================================================================
// Site Footer Component
// =============================================================================

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={`border-t py-8 ${className ?? ""}`}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-4">
          {/* Footer Navigation */}
          <Suspense fallback={null}>
            <FooterNavigation />
          </Suspense>

          {/* Copyright / Tech Stack */}
          <p className="text-center text-sm text-muted-foreground">
            Built with Next.js 16, Tailwind CSS v4, and <Link href="https://flxbl.dev" target="_blank" className="text-primary hover:underline">FLXBL</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

