"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Plus,
  Type,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  FileCode,
  Image,
  Minus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// =============================================================================
// Block Types
// =============================================================================

interface BlockType {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: Editor, openMediaPicker?: () => void) => void;
  requiresMediaPicker?: boolean;
}

const blockTypes: BlockType[] = [
  {
    id: "paragraph",
    label: "Paragraph",
    description: "Plain text paragraph",
    icon: Type,
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "bulletList",
    label: "Bullet List",
    description: "Unordered list of items",
    icon: List,
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    label: "Numbered List",
    description: "Ordered list of items",
    icon: ListOrdered,
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    label: "Quote",
    description: "Highlighted quote block",
    icon: Quote,
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "codeBlock",
    label: "Code Block",
    description: "Syntax highlighted code",
    icon: FileCode,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "image",
    label: "Image",
    description: "Insert an image from media library",
    icon: Image,
    requiresMediaPicker: true,
    action: (editor, openMediaPicker) => {
      if (openMediaPicker) {
        openMediaPicker();
      }
    },
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal separator",
    icon: Minus,
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "callout",
    label: "Callout",
    description: "Highlighted info box",
    icon: AlertCircle,
    action: (editor) => {
      // Insert as blockquote - will be styled as callout via CSS
      editor.chain().focus().toggleBlockquote().run();
    },
  },
];

// =============================================================================
// Block Menu Component
// =============================================================================

interface BlockMenuProps {
  editor: Editor;
  onOpenMediaPicker?: () => void;
}

export function BlockMenu({ editor, onOpenMediaPicker }: BlockMenuProps) {
  const [open, setOpen] = useState(false);

  const handleBlockSelect = (block: BlockType) => {
    if (block.requiresMediaPicker && onOpenMediaPicker) {
      block.action(editor, onOpenMediaPicker);
    } else {
      block.action(editor);
    }
    setOpen(false);
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="size-4" />
            Add Block
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">
              Insert Block
            </p>
            {blockTypes.map((block) => (
              <button
                key={block.id}
                onClick={() => handleBlockSelect(block)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-md px-2 py-2 text-left",
                  "hover:bg-muted transition-colors"
                )}
              >
                <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                  <block.icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{block.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {block.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

