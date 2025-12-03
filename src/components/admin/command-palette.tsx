"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Image,
  FolderTree,
  Users,
  Settings,
  LayoutDashboard,
  Plus,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

// =============================================================================
// Navigation Commands
// =============================================================================

interface CommandItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  action: string;
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

const navigationCommands: CommandGroup[] = [
  {
    heading: "Quick Actions",
    items: [
      {
        icon: Plus,
        label: "New Content",
        shortcut: "N",
        action: "/admin/content/new",
      },
    ],
  },
  {
    heading: "Navigation",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        action: "/admin",
      },
      {
        icon: FileText,
        label: "Content",
        action: "/admin/content",
      },
      {
        icon: Image,
        label: "Media Library",
        action: "/admin/media",
      },
      {
        icon: FolderTree,
        label: "Categories",
        action: "/admin/categories",
      },
      {
        icon: Users,
        label: "Authors",
        action: "/admin/authors",
      },
      {
        icon: Settings,
        label: "Settings",
        action: "/admin/settings",
      },
    ],
  },
];

// =============================================================================
// Command Palette Component
// =============================================================================

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {navigationCommands.map((group, index) => (
          <React.Fragment key={group.heading}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={() => runCommand(() => router.push(item.action))}
                >
                  <item.icon className="mr-2 size-4" />
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">⌘</span>{item.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

// =============================================================================
// Command Palette Trigger Button
// =============================================================================

export function CommandPaletteTrigger() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <button
      onClick={() => setOpen(true)}
      className="relative h-9 w-full justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-normal text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <span className="hidden lg:inline-flex items-center gap-2">
        <Search className="size-4" />
        Search...
      </span>
      <span className="inline-flex lg:hidden">
        <Search className="size-4" />
      </span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}

