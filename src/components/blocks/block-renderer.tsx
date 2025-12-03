"use client";

import Image from "next/image";
import type { ContentBlock } from "@/lib/flxbl/types";

// =============================================================================
// Block Renderer Component
// =============================================================================

interface BlockRendererProps {
  blocks: ContentBlock[];
  className?: string;
}

export function BlockRenderer({ blocks, className }: BlockRendererProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);

  return (
    <div className={className}>
      {sortedBlocks.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </div>
  );
}

// =============================================================================
// Individual Block Components
// =============================================================================

function BlockItem({ block }: { block: ContentBlock }) {
  const content = block.content as Record<string, unknown>;

  switch (block.blockType) {
    case "PARAGRAPH":
      return <ParagraphBlock content={content} />;
    case "HEADING":
      return <HeadingBlock content={content} />;
    case "IMAGE":
      return <ImageBlock content={content} />;
    case "QUOTE":
      return <QuoteBlock content={content} />;
    case "CODE":
      return <CodeBlock content={content} />;
    case "LIST":
      return <ListBlock content={content} />;
    case "DIVIDER":
      return <DividerBlock />;
    case "CALLOUT":
      return <CalloutBlock content={content} />;
    case "EMBED":
      return <EmbedBlock content={content} />;
    default:
      return null;
  }
}

// =============================================================================
// Paragraph Block
// =============================================================================

function ParagraphBlock({ content }: { content: Record<string, unknown> }) {
  const text = (content.text as string) || "";
  
  if (!text.trim()) return null;

  return (
    <p className="my-4 leading-relaxed text-foreground/90">
      {text}
    </p>
  );
}

// =============================================================================
// Heading Block
// =============================================================================

function HeadingBlock({ content }: { content: Record<string, unknown> }) {
  const text = (content.text as string) || "";
  const level = (content.level as number) || 2;

  const classNames: Record<number, string> = {
    1: "mt-8 mb-4 text-3xl font-bold",
    2: "mt-8 mb-4 text-2xl font-bold",
    3: "mt-6 mb-3 text-xl font-semibold",
    4: "mt-6 mb-3 text-lg font-semibold",
  };
  const className = classNames[level] || "mt-6 mb-3 text-lg font-semibold";

  switch (level) {
    case 1:
      return <h1 className={className}>{text}</h1>;
    case 2:
      return <h2 className={className}>{text}</h2>;
    case 3:
      return <h3 className={className}>{text}</h3>;
    case 4:
      return <h4 className={className}>{text}</h4>;
    default:
      return <h2 className={className}>{text}</h2>;
  }
}

// =============================================================================
// Image Block
// =============================================================================

function ImageBlock({ content }: { content: Record<string, unknown> }) {
  const src = (content.src as string) || "";
  const alt = (content.alt as string) || (content.caption as string) || "";
  const caption = (content.caption as string) || "";

  if (!src) return null;

  return (
    <figure className="my-6">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// =============================================================================
// Quote Block
// =============================================================================

function QuoteBlock({ content }: { content: Record<string, unknown> }) {
  const text = (content.text as string) || "";
  const attribution = (content.attribution as string) || "";

  return (
    <blockquote className="my-6 border-l-4 border-primary pl-4 italic">
      <p className="text-foreground/90">{text}</p>
      {attribution && (
        <cite className="mt-2 block text-sm text-muted-foreground not-italic">
          — {attribution}
        </cite>
      )}
    </blockquote>
  );
}

// =============================================================================
// Code Block
// =============================================================================

function CodeBlock({ content }: { content: Record<string, unknown> }) {
  const code = (content.code as string) || "";
  const language = (content.language as string) || "";

  return (
    <pre className="my-6 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
      <code className={language ? `language-${language}` : ""}>
        {code}
      </code>
    </pre>
  );
}

// =============================================================================
// List Block
// =============================================================================

function ListBlock({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as string[]) || [];
  const ordered = (content.ordered as boolean) || false;

  const Tag = ordered ? "ol" : "ul";
  const listClass = ordered
    ? "my-4 ml-6 list-decimal space-y-2"
    : "my-4 ml-6 list-disc space-y-2";

  return (
    <Tag className={listClass}>
      {items.map((item, index) => (
        <li key={index} className="text-foreground/90">
          {item}
        </li>
      ))}
    </Tag>
  );
}

// =============================================================================
// Divider Block
// =============================================================================

function DividerBlock() {
  return <hr className="my-8 border-t border-border" />;
}

// =============================================================================
// Callout Block
// =============================================================================

function CalloutBlock({ content }: { content: Record<string, unknown> }) {
  const text = (content.text as string) || "";
  const type = (content.type as string) || "info";

  const colors = {
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100",
    error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
    success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
  }[type] || "bg-muted border-border text-foreground";

  return (
    <div className={`my-6 rounded-lg border p-4 ${colors}`}>
      {text}
    </div>
  );
}

// =============================================================================
// Embed Block
// =============================================================================

function EmbedBlock({ content }: { content: Record<string, unknown> }) {
  const url = (content.url as string) || "";
  const caption = (content.caption as string) || "";

  if (!url) return null;

  // Simple embed - in production, you'd handle different embed types (YouTube, Twitter, etc.)
  return (
    <figure className="my-6">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        <iframe
          src={url}
          className="absolute inset-0 h-full w-full"
          allowFullScreen
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

