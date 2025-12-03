import Link from "next/link";
import { getFlxblClient } from "@/lib/flxbl/config";
import { getNavigationTree, type PageTreeNode } from "@/lib/flxbl/pages";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface SiteNavigationProps {
  className?: string;
}

// =============================================================================
// Navigation Item Components
// =============================================================================

function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      {children}
    </Link>
  );
}

function NavItemWithChildren({ node }: { node: PageTreeNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-sm font-medium text-muted-foreground hover:text-foreground h-auto py-1 px-2"
        >
          {node.title}
          <ChevronDown className="ml-1 size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {/* Parent link */}
        <DropdownMenuItem asChild>
          <Link href={node.path} className="font-medium">
            {node.title}
          </Link>
        </DropdownMenuItem>
        {/* Child links */}
        {node.children.map((child) => (
          <DropdownMenuItem key={child.id} asChild>
            <Link href={child.path}>{child.title}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =============================================================================
// Main Navigation Component
// =============================================================================

export async function SiteNavigation({ className }: SiteNavigationProps) {
  const client = getFlxblClient();
  
  let navTree: PageTreeNode[] = [];
  try {
    navTree = await getNavigationTree(client, true);
  } catch (error) {
    console.error("Failed to fetch navigation tree:", error);
    return null;
  }

  // Filter to only show pages that should appear in nav
  const visiblePages = navTree.filter((page) => page.showInNav);

  if (visiblePages.length === 0) {
    return null;
  }

  return (
    <nav className={cn("flex items-center gap-6", className)}>
      {visiblePages.map((node) => {
        // If the node has children that should show in nav, render as dropdown
        const visibleChildren = node.children.filter((c) => c.showInNav);

        if (visibleChildren.length > 0) {
          return (
            <NavItemWithChildren
              key={node.id}
              node={{ ...node, children: visibleChildren }}
            />
          );
        }

        // Simple link for pages without children
        return (
          <NavLink key={node.id} href={node.path}>
            {node.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

// =============================================================================
// Export nav tree for client components
// =============================================================================

export interface MobileNavItem {
  id: string;
  title: string;
  path: string;
  children: MobileNavItem[];
}

export async function getMobileNavItems(): Promise<MobileNavItem[]> {
  const client = getFlxblClient();
  const navTree = await getNavigationTree(client, true);

  const mapNode = (node: PageTreeNode): MobileNavItem => ({
    id: node.id,
    title: node.title,
    path: node.path,
    children: node.children.filter((c) => c.showInNav).map(mapNode),
  });

  return navTree.filter((page) => page.showInNav).map(mapNode);
}
