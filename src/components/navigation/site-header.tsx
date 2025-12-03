import Link from "next/link";
import { Suspense } from "react";
import { SiteNavigation } from "./site-navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// Types
// =============================================================================

interface SiteHeaderProps {
  showAdminLink?: boolean;
}

// =============================================================================
// Navigation Fallback
// =============================================================================

function NavigationFallback() {
  return (
    <div className="flex items-center gap-6">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

// =============================================================================
// Site Header Component
// =============================================================================

export function SiteHeader({ showAdminLink = false }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">Kickass CMS</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <Suspense fallback={<NavigationFallback />}>
            <SiteNavigation />
          </Suspense>

          {showAdminLink && (
            <Link
              href="/admin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

