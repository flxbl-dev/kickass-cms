"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/theme-toggle";

// =============================================================================
// Breadcrumb Generation
// =============================================================================

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  admin: "Dashboard",
  content: "Content",
  media: "Media",
  categories: "Categories",
  authors: "Authors",
  settings: "Settings",
  new: "New",
};

function generateBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [];

  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip 'admin' as we show it as Dashboard
    if (i === 0 && segment === "admin") {
      breadcrumbs.push({
        label: "Dashboard",
        href: "/admin",
      });
      continue;
    }

    // Check if this is a dynamic segment (ID)
    const isId = segment.length > 20 || /^[a-f0-9-]{36}$/i.test(segment);

    if (isId) {
      breadcrumbs.push({
        label: "Edit",
      });
    } else {
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Last segment doesn't need a link
      if (i === segments.length - 1) {
        breadcrumbs.push({ label });
      } else {
        breadcrumbs.push({
          label,
          href: currentPath,
        });
      }
    }
  }

  return breadcrumbs;
}

// =============================================================================
// Breadcrumb Component
// =============================================================================

function BreadcrumbComponent({ pathname }: { pathname: string }) {
  const breadcrumbs = generateBreadcrumbs(pathname);

  if (breadcrumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <Fragment key={index}>
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// =============================================================================
// Admin Header Component
// =============================================================================

export function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <BreadcrumbComponent pathname={pathname} />
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

