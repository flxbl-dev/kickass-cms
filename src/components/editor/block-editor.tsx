"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import TiptapImage from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { EditorToolbar } from "./toolbar";
import { BlockMenu } from "./block-menu";
import { MediaPicker } from "@/components/admin/media-picker";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/flxbl/types";

// =============================================================================
// Lowlight Configuration
// =============================================================================

const lowlight = createLowlight(common);

// =============================================================================
// Editor Configuration
// =============================================================================

import type { JSONContent } from "@tiptap/react";

interface BlockEditorProps {
  content?: string;
  jsonContent?: JSONContent;
  onChange?: (content: string) => void;
  onJsonChange?: (json: JSONContent) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function BlockEditor({
  content = "",
  jsonContent,
  onChange,
  onJsonChange,
  placeholder = "Start writing...",
  className,
  editable = true,
}: BlockEditorProps) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Use JSON content if provided, otherwise fall back to HTML string
  const initialContent = jsonContent ?? content;

  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration issue
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
          HTMLAttributes: {
            class: "tiptap-heading",
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: "tiptap-paragraph",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "tiptap-list list-disc",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "tiptap-list list-decimal",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "tiptap-list-item",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "tiptap-blockquote",
          },
        },
        horizontalRule: {
          HTMLAttributes: {
            class: "tiptap-hr",
          },
        },
        codeBlock: false, // Use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Typography, // Smart typography: curly quotes, em-dashes, etc.
      TiptapImage.configure({
        HTMLAttributes: {
          class: "tiptap-image rounded-lg max-w-full",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "typescript",
        HTMLAttributes: {
          class: "tiptap-code-block",
        },
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onChange?.(html);
      onJsonChange?.(json);
    },
    editorProps: {
      attributes: {
        class: cn(
          "tiptap-editor min-h-[300px] focus:outline-none"
        ),
      },
    },
  });

  const handleOpenMediaPicker = useCallback(() => {
    setMediaPickerOpen(true);
  }, []);

  const handleMediaSelect = useCallback(
    (media: Media) => {
      if (editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: media.url, alt: media.alt ?? media.filename })
          .run();
      }
    },
    [editor]
  );

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {editor && editable && <EditorToolbar editor={editor} />}
      <div className="p-4">
        <EditorContent editor={editor} />
        {editor && editable && (
          <BlockMenu editor={editor} onOpenMediaPicker={handleOpenMediaPicker} />
        )}
      </div>

      {/* Media Picker Dialog */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        accept="image/*"
        title="Insert Image"
        description="Select an image from your media library or upload a new one."
      />
    </div>
  );
}

// =============================================================================
// Export Editor Type
// =============================================================================

export type { Editor };

