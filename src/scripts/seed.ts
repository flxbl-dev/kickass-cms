/**
 * Seed script for populating FLXBL with sample CMS data (v3.0.0 Schema)
 *
 * Usage: pnpm seed
 *
 * This script is idempotent - it checks for existing data before creating.
 * Rate limits are respected with delays between operations.
 * 
 * All seeded content is marked with isSystem: true for demo protection.
 */

import { createFlxblClient, type FlxblClient } from "../lib/flxbl/client";
import type {
  CreateAuthor,
  CreateCategory,
  CreateMedia,
  CreateContent,
  CreateContentBlock,
  CreateWorkflowState,
  CreateLayout,
  CreateBlock,
  CreatePage,
  CreatePageSection,
  AuthorRole,
  MediaRole,
  BlockType,
  GlobalBlockType,
  PageSectionType,
} from "../lib/flxbl/types";

// =============================================================================
// Configuration
// =============================================================================

const DELAY_MS = 1000; // Delay between API calls to respect rate limits

function getConfig() {
  const baseUrl = process.env.FLXBL_BASE_URL;
  const apiKey = process.env.FLXBL_API_KEY;

  if (!baseUrl || !apiKey) {
    console.error("Error: Missing environment variables");
    console.error("Make sure FLXBL_BASE_URL and FLXBL_API_KEY are set in .env.local");
    process.exit(1);
  }

  return { baseUrl, apiKey };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// =============================================================================
// Workflow States
// =============================================================================

const workflowStates: (CreateWorkflowState & { isSystem: boolean })[] = [
  {
    name: "Draft",
    slug: "draft",
    color: "#6B7280", // Gray
    description: "Content being written or edited",
    position: 0,
    allowedTransitions: ["in-review"],
    isSystem: true,
  },
  {
    name: "In Review",
    slug: "in-review",
    color: "#F59E0B", // Amber
    description: "Content awaiting editorial review",
    position: 1,
    allowedTransitions: ["draft", "approved"],
    isSystem: true,
  },
  {
    name: "Approved",
    slug: "approved",
    color: "#3B82F6", // Blue
    description: "Content approved, ready for publishing",
    position: 2,
    allowedTransitions: ["in-review", "published"],
    isSystem: true,
  },
  {
    name: "Published",
    slug: "published",
    color: "#10B981", // Green
    description: "Content live and visible to readers",
    position: 3,
    allowedTransitions: ["archived"],
    isSystem: true,
  },
  {
    name: "Archived",
    slug: "archived",
    color: "#6366F1", // Indigo
    description: "Content removed from public view",
    position: 4,
    allowedTransitions: ["draft"],
    isSystem: true,
  },
];

// =============================================================================
// Layouts
// =============================================================================

const layouts: (CreateLayout & { isSystem: boolean })[] = [
  {
    name: "Single Column",
    slug: "single-column",
    description: "Simple single column layout for articles",
    regions: {
      main: { name: "Main Content", maxBlocks: null },
    },
    template: "single-column",
    isSystem: true,
  },
  {
    name: "Two Column with Sidebar",
    slug: "two-column-sidebar",
    description: "Main content with sidebar for additional widgets",
    regions: {
      main: { name: "Main Content", maxBlocks: null },
      sidebar: { name: "Sidebar", maxBlocks: 5 },
    },
    template: "two-column-sidebar",
    isSystem: true,
  },
  {
    name: "Full Width",
    slug: "full-width",
    description: "Full width layout for landing pages",
    regions: {
      hero: { name: "Hero Section", maxBlocks: 1 },
      main: { name: "Main Content", maxBlocks: null },
      footer: { name: "Footer Widgets", maxBlocks: 3 },
    },
    template: "full-width",
    isSystem: true,
  },
];

// =============================================================================
// Global Blocks
// =============================================================================

const globalBlocks: (CreateBlock & { isSystem: boolean })[] = [
  {
    name: "Author Bio Widget",
    blockType: "AUTHOR_BIO" as GlobalBlockType,
    content: { showAvatar: true, showBio: true, showSocial: true },
    isGlobal: true,
    isSystem: true,
  },
  {
    name: "Related Posts Widget",
    blockType: "RELATED_POSTS" as GlobalBlockType,
    content: { count: 3, showThumbnail: true },
    isGlobal: true,
    isSystem: true,
  },
  {
    name: "Newsletter Signup",
    blockType: "NEWSLETTER" as GlobalBlockType,
    content: {
      title: "Stay Updated",
      description: "Get the latest articles delivered to your inbox",
      buttonText: "Subscribe",
    },
    isGlobal: true,
    isSystem: true,
  },
  {
    name: "Try Kickass CMS CTA",
    blockType: "CTA" as GlobalBlockType,
    content: {
      title: "Ready to build something amazing?",
      description: "Get started with Kickass CMS today",
      buttonText: "Get Started",
      buttonUrl: "/signup",
    },
    isGlobal: true,
    isSystem: true,
  },
  {
    name: "Homepage Hero",
    blockType: "CTA" as GlobalBlockType,
    content: {
      title: "Experience Graph-Powered Content",
      description: "Explore pages, articles, and dynamic category listings - all driven by FLXBL graph relationships. Navigate through a fully functional CMS demo.",
      buttonText: "View Blog",
      buttonUrl: "/blog",
    },
    isGlobal: true,
    isSystem: true,
  },
  {
    name: "404 Not Found",
    blockType: "CUSTOM" as GlobalBlockType,
    content: {
      html: `
        <div class="text-center py-12">
          <div class="text-8xl font-bold text-primary/20 mb-4">404</div>
          <h2 class="text-2xl font-bold mb-4">Lost in the Graph?</h2>
          <p class="text-muted-foreground mb-6">The page you're looking for doesn't exist or has been moved. Don't worry, even the best graph traversals sometimes hit a dead end.</p>
        </div>
      `,
    },
    isGlobal: true,
    isSystem: true,
  },
  {
    name: "Features Showcase",
    blockType: "CUSTOM" as GlobalBlockType,
    content: {
      html: `
        <div class="grid gap-6 md:grid-cols-3 py-8">
          <div class="p-6 border rounded-lg">
            <h3 class="font-semibold text-lg mb-2">Graph-Powered</h3>
            <p class="text-muted-foreground text-sm">Content relationships modeled as a graph for flexible, powerful queries.</p>
          </div>
          <div class="p-6 border rounded-lg">
            <h3 class="font-semibold text-lg mb-2">Block-Based Editor</h3>
            <p class="text-muted-foreground text-sm">Rich content editing with Tiptap - paragraphs, code, images, and more.</p>
          </div>
          <div class="p-6 border rounded-lg">
            <h3 class="font-semibold text-lg mb-2">Dynamic Layouts</h3>
            <p class="text-muted-foreground text-sm">Flexible page layouts with configurable regions and global blocks.</p>
          </div>
        </div>
      `,
    },
    isGlobal: true,
    isSystem: true,
  },
];

// =============================================================================
// Authors
// =============================================================================

const authors: (CreateAuthor & { isSystem: boolean })[] = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@kickass-cms.dev",
    bio: "Senior tech writer with 10+ years of experience covering AI, cloud computing, and developer tools. Previously at TechCrunch and Wired.",
    avatarUrl: "https://i.pravatar.cc/150?u=sarah.chen",
    isSystem: true,
  },
  {
    name: "Marcus Johnson",
    email: "marcus.johnson@kickass-cms.dev",
    bio: "Editor-in-chief passionate about clear, accessible technical communication. Believes great documentation is a superpower.",
    avatarUrl: "https://i.pravatar.cc/150?u=marcus.johnson",
    isSystem: true,
  },
  {
    name: "Elena Rodriguez",
    email: "elena.rodriguez@kickass-cms.dev",
    bio: "Guest contributor and startup founder writing about entrepreneurship, product development, and the future of work.",
    avatarUrl: "https://i.pravatar.cc/150?u=elena.rodriguez",
    isSystem: true,
  },
  {
    name: "Admin User",
    email: "admin@kickass-cms.dev",
    bio: "System administrator for Kickass CMS. Keeper of the keys and guardian of the graph.",
    avatarUrl: "https://i.pravatar.cc/150?u=admin",
    isSystem: true,
  },
];

// =============================================================================
// Categories
// =============================================================================

const categories: Array<CreateCategory & { parentSlug?: string; isSystem: boolean }> = [
  { name: "News", slug: "news", description: "Latest announcements and updates", isSystem: true },
  { name: "Technology", slug: "technology", description: "Deep dives into tech topics", isSystem: true },
  { name: "Artificial Intelligence", slug: "ai", description: "AI and machine learning insights", parentSlug: "technology", isSystem: true },
  { name: "Machine Learning", slug: "machine-learning", description: "ML tutorials and best practices", parentSlug: "ai", isSystem: true },
  { name: "Web Development", slug: "web-development", description: "Frontend and backend development", parentSlug: "technology", isSystem: true },
  { name: "Lifestyle", slug: "lifestyle", description: "Work-life balance and developer wellness", isSystem: true },
  { name: "Tutorials", slug: "tutorials", description: "Step-by-step guides and how-tos", isSystem: true },
  { name: "Opinion", slug: "opinion", description: "Perspectives and thought leadership", isSystem: true },
];

// =============================================================================
// Media Items
// =============================================================================

const mediaItems: (CreateMedia & { isSystem: boolean })[] = [
  { filename: "hero-ai-future.jpg", url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 245000, alt: "AI and the future of technology", caption: "Exploring the frontiers of artificial intelligence", isSystem: true },
  { filename: "coding-workspace.jpg", url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 198000, alt: "Modern coding workspace", caption: "A developer's daily environment", isSystem: true },
  { filename: "team-collaboration.jpg", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 215000, alt: "Team collaboration", caption: "Remote teams working together", isSystem: true },
  { filename: "server-room.jpg", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 267000, alt: "Data center servers", caption: "The backbone of cloud computing", isSystem: true },
  { filename: "startup-office.jpg", url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 189000, alt: "Startup office space", caption: "Where innovation happens", isSystem: true },
  { filename: "code-screen.jpg", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 156000, alt: "Code on screen", caption: "Clean code in action", isSystem: true },
  { filename: "coffee-laptop.jpg", url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 134000, alt: "Coffee and laptop", caption: "Developer fuel", isSystem: true },
  { filename: "conference-talk.jpg", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 278000, alt: "Tech conference presentation", caption: "Sharing knowledge at scale", isSystem: true },
  { filename: "neural-network.jpg", url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 312000, alt: "Neural network visualization", caption: "The architecture of AI", isSystem: true },
  { filename: "mobile-dev.jpg", url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 187000, alt: "Mobile development", caption: "Building for the mobile-first world", isSystem: true },
  { filename: "cloud-diagram.jpg", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 145000, alt: "Cloud architecture diagram", caption: "Designing scalable systems", isSystem: true },
  { filename: "productivity-setup.jpg", url: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 203000, alt: "Productivity workstation", caption: "Optimizing the developer experience", isSystem: true },
  { filename: "graph-database.jpg", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop", mimeType: "image/jpeg", size: 220000, alt: "Connected nodes visualization", caption: "Graph databases power modern applications", isSystem: true },
];

// =============================================================================
// Content with Blocks
// =============================================================================

interface ContentSeed extends Omit<CreateContent, "contentType"> {
  contentType: "PAGE" | "POST" | "ARTICLE";
  authorEmail: string;
  authorRole: AuthorRole;
  categorySlug: string;
  featuredMediaIndex: number;
  stateSlug: string;
  isSystem: boolean;
  blocks: Array<{
    blockType: BlockType;
    content: Record<string, unknown>;
  }>;
}

const contentItems: ContentSeed[] = [
  {
    title: "The Future of AI: What's Next for Machine Learning",
    slug: "future-of-ai-machine-learning",
    excerpt: "Explore the cutting-edge developments in artificial intelligence and how machine learning is reshaping industries from healthcare to finance.",
    contentType: "ARTICLE",
    publishedAt: new Date("2024-01-15"),
    tags: ["ai", "machine-learning", "technology", "future"],
    authorEmail: "sarah.chen@kickass-cms.dev",
    authorRole: "PRIMARY",
    categorySlug: "ai",
    featuredMediaIndex: 0,
    stateSlug: "published",
    isSystem: true,
    blocks: [
      {
        blockType: "HEADING",
        content: { text: "The AI Revolution is Here", level: 2 },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "Artificial intelligence has moved from science fiction to everyday reality. From voice assistants that understand natural language to recommendation systems that predict your preferences with uncanny accuracy, AI touches nearly every aspect of modern life. But we're only scratching the surface of what's possible.", format: "markdown" },
      },
      {
        blockType: "CALLOUT",
        content: { text: "By 2025, the global AI market is projected to exceed $190 billion, with applications spanning healthcare diagnostics, autonomous vehicles, financial trading, and creative content generation.", variant: "info", title: "Market Insight" },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "The rapid advancement of Large Language Models (LLMs) like GPT-4, Claude, and Gemini has democratized access to AI capabilities that were previously available only to well-funded research labs. Developers can now integrate sophisticated natural language processing into their applications with just a few lines of code.", format: "markdown" },
      },
      {
        blockType: "HEADING",
        content: { text: "Key Trends Shaping the Future", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["Multimodal AI: Systems that understand text, images, audio, and video simultaneously", "Edge Computing: AI models running locally on devices for privacy and speed", "AI Agents: Autonomous systems that can plan and execute complex tasks", "Responsible AI: Growing focus on bias detection, explainability, and ethical deployment"], ordered: false },
      },
      {
        blockType: "HEADING",
        content: { text: "The Developer's Opportunity", level: 2 },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "For developers, this presents an unprecedented opportunity. The barriers to entry have never been lower. Whether you're building a chatbot, implementing image recognition, or creating a recommendation engine, the tools and APIs available today make it possible to ship AI-powered features in hours, not months.", format: "markdown" },
      },
      {
        blockType: "CODE",
        content: { code: "import { OpenAI } from 'openai';\n\nconst client = new OpenAI();\n\nconst response = await client.chat.completions.create({\n  model: 'gpt-4',\n  messages: [\n    { role: 'system', content: 'You are a helpful assistant.' },\n    { role: 'user', content: 'Explain quantum computing simply.' }\n  ]\n});\n\nconsole.log(response.choices[0].message.content);", language: "typescript", filename: "ai-chat.ts" },
      },
      {
        blockType: "QUOTE",
        content: { text: "The best way to predict the future is to invent it. With AI, we're not just predicting - we're actively shaping a new era of human-machine collaboration.", attribution: "Alan Kay (adapted)" },
      },
    ],
  },
  {
    title: "Building Scalable Web Applications with Next.js",
    slug: "building-scalable-nextjs-apps",
    excerpt: "Learn best practices for building performant, scalable web applications using Next.js, React Server Components, and modern deployment strategies.",
    contentType: "ARTICLE",
    publishedAt: new Date("2024-01-20"),
    tags: ["nextjs", "react", "web-development", "tutorial"],
    authorEmail: "marcus.johnson@kickass-cms.dev",
    authorRole: "PRIMARY",
    categorySlug: "web-development",
    featuredMediaIndex: 1,
    stateSlug: "published",
    isSystem: true,
    blocks: [
      {
        blockType: "PARAGRAPH",
        content: { text: "Next.js has become the go-to framework for building modern web applications. With its hybrid rendering capabilities, built-in optimizations, and excellent developer experience, it's no wonder that companies from startups to enterprises are choosing Next.js for their production applications.", format: "markdown" },
      },
      {
        blockType: "HEADING",
        content: { text: "Getting Started", level: 2 },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "Creating a new Next.js project is straightforward. The CLI handles all the boilerplate, letting you focus on building features from day one:", format: "markdown" },
      },
      {
        blockType: "CODE",
        content: { code: "# Create a new Next.js app with the latest features\nnpx create-next-app@latest my-app --typescript --tailwind --app\n\ncd my-app\npnpm dev", language: "bash", filename: "terminal" },
      },
      {
        blockType: "HEADING",
        content: { text: "React Server Components", level: 2 },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "One of the most powerful features in Next.js 13+ is React Server Components (RSC). They allow you to render components on the server, reducing the JavaScript sent to the client and improving performance.", format: "markdown" },
      },
      {
        blockType: "CODE",
        content: { code: "// app/posts/page.tsx - This is a Server Component by default\nimport { getPosts } from '@/lib/api';\n\nexport default async function PostsPage() {\n  // This runs on the server - no client-side API calls!\n  const posts = await getPosts();\n\n  return (\n    <div className=\"grid gap-4\">\n      {posts.map((post) => (\n        <article key={post.id} className=\"border rounded-lg p-4\">\n          <h2 className=\"text-xl font-bold\">{post.title}</h2>\n          <p className=\"text-muted-foreground\">{post.excerpt}</p>\n        </article>\n      ))}\n    </div>\n  );\n}", language: "typescript", filename: "app/posts/page.tsx" },
      },
      {
        blockType: "CALLOUT",
        content: { text: "Server Components can directly access databases, file systems, and internal APIs without exposing secrets to the client. This simplifies architecture and improves security.", variant: "info", title: "Pro Tip" },
      },
      {
        blockType: "HEADING",
        content: { text: "Performance Optimization", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["Use dynamic imports for code splitting: const Modal = dynamic(() => import('./Modal'))", "Implement proper image optimization with next/image", "Leverage ISR (Incremental Static Regeneration) for cached, fresh content", "Use the built-in Link component for client-side navigation"], ordered: true },
      },
    ],
  },
  {
    title: "Remote Work Best Practices for Developer Teams",
    slug: "remote-work-best-practices",
    excerpt: "Discover proven strategies for maintaining productivity, collaboration, and team culture in distributed developer teams.",
    contentType: "ARTICLE",
    publishedAt: new Date("2024-01-18"),
    tags: ["remote-work", "productivity", "teams", "culture"],
    authorEmail: "elena.rodriguez@kickass-cms.dev",
    authorRole: "PRIMARY",
    categorySlug: "lifestyle",
    featuredMediaIndex: 2,
    stateSlug: "published",
    isSystem: true,
    blocks: [
      {
        blockType: "PARAGRAPH",
        content: { text: "Remote work is here to stay. As more companies embrace distributed teams, understanding how to work effectively from anywhere has become essential for career success. After managing remote teams for five years, here are the strategies that actually work.", format: "markdown" },
      },
      {
        blockType: "QUOTE",
        content: { text: "The future of work is not about where you work, but how you work. Remote-first doesn't mean alone-first.", attribution: "GitLab Remote Work Report" },
      },
      {
        blockType: "HEADING",
        content: { text: "Communication is Key", level: 2 },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "In a remote environment, you can't rely on hallway conversations or quick desk drop-ins. Over-communicate rather than under-communicate. Document decisions in writing. Use asynchronous communication tools effectively and establish clear expectations for response times.", format: "markdown" },
      },
      {
        blockType: "CALLOUT",
        content: { text: "Set 'communication hours' in your calendar when teammates can expect real-time responses. Outside those hours, async communication prevails.", variant: "success", title: "Async-First Rule" },
      },
      {
        blockType: "HEADING",
        content: { text: "Building Team Culture Remotely", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["Schedule regular virtual coffee chats - non-work conversations matter", "Celebrate wins publicly in team channels", "Create dedicated spaces for casual interaction (like a #random Slack channel)", "Host optional virtual events - game nights, show-and-tells, learning sessions"], ordered: false },
      },
      {
        blockType: "HEADING",
        content: { text: "Your Workspace Matters", level: 2 },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "Invest in your home office setup. A good chair, proper lighting, and a dedicated workspace signal to your brain that it's time to work. Separate your work area from relaxation spaces when possible - even if it's just facing a different direction.", format: "markdown" },
      },
    ],
  },
  {
    title: "Understanding Graph Databases: A Practical Guide",
    slug: "understanding-graph-databases",
    excerpt: "Dive into the world of graph databases and learn how they differ from traditional relational databases, with practical examples and use cases.",
    contentType: "ARTICLE",
    publishedAt: new Date("2024-01-25"),
    tags: ["databases", "graph", "technology", "tutorial"],
    authorEmail: "sarah.chen@kickass-cms.dev",
    authorRole: "PRIMARY",
    categorySlug: "technology",
    featuredMediaIndex: 12,
    stateSlug: "published",
    isSystem: true,
    blocks: [
      {
        blockType: "PARAGRAPH",
        content: { text: "Graph databases represent data as nodes and relationships, making them ideal for highly connected data like social networks, recommendation engines, and content management systems. Unlike relational databases that store data in rigid tables, graph databases embrace the natural connections in your data.", format: "markdown" },
      },
      {
        blockType: "HEADING",
        content: { text: "Why Graph Databases?", level: 2 },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "Consider a content management system. An article has an author. That author writes for multiple categories. Categories can be nested. The article references other articles. In a relational database, this requires multiple JOIN operations. In a graph database, you simply follow relationships.", format: "markdown" },
      },
      {
        blockType: "LIST",
        content: { items: ["Natural data modeling - relationships are first-class citizens", "Efficient traversals - following connections is O(1), not O(n)", "Flexible schema - add new relationship types without migrations", "Real-time queries - complex relationship queries return in milliseconds"], ordered: false },
      },
      {
        blockType: "HEADING",
        content: { text: "A Practical Example", level: 2 },
      },
      {
        blockType: "CODE",
        content: { code: "// Create nodes\nCREATE (article:Content {title: 'Graph Databases 101'})\nCREATE (author:Author {name: 'Sarah Chen'})\nCREATE (category:Category {name: 'Technology'})\n\n// Create relationships\nCREATE (article)-[:AUTHORED_BY {role: 'PRIMARY'}]->(author)\nCREATE (article)-[:CATEGORIZED_AS]->(category)\n\n// Query: Find all articles by authors who write about Technology\nMATCH (a:Author)-[:AUTHORED_BY]-(article:Content)-[:CATEGORIZED_AS]->(c:Category {name: 'Technology'})\nRETURN a.name, article.title", language: "cypher", filename: "graph-query.cypher" },
      },
      {
        blockType: "CALLOUT",
        content: { text: "Graph queries that would require complex JOINs in SQL can be expressed naturally as path traversals. The query reads like English: 'Find authors connected to articles that are categorized as Technology.'", variant: "info" },
      },
      {
        blockType: "HEADING",
        content: { text: "When to Use Graph Databases", level: 2 },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "Graph databases excel when relationships are as important as the data itself. Social networks, fraud detection, recommendation systems, knowledge graphs, and content management systems are all excellent use cases. If you find yourself writing many-to-many tables or complex recursive queries, a graph database might be the answer.", format: "markdown" },
      },
    ],
  },
  {
    title: "10 VS Code Extensions Every Developer Needs",
    slug: "vscode-extensions-developers",
    excerpt: "Boost your productivity with these essential VS Code extensions for code quality, debugging, and developer experience.",
    contentType: "POST",
    publishedAt: new Date("2024-01-22"),
    tags: ["vscode", "tools", "productivity", "development"],
    authorEmail: "marcus.johnson@kickass-cms.dev",
    authorRole: "PRIMARY",
    categorySlug: "tutorials",
    featuredMediaIndex: 5,
    stateSlug: "published",
    isSystem: true,
    blocks: [
      {
        blockType: "PARAGRAPH",
        content: { text: "Visual Studio Code is powerful out of the box, but the right extensions can supercharge your development workflow. Here are the extensions I install on every new machine.", format: "markdown" },
      },
      {
        blockType: "HEADING",
        content: { text: "Code Quality", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["ESLint - Catch errors and enforce code style automatically", "Prettier - Format code consistently across your team", "Error Lens - See errors inline, right where they occur", "SonarLint - Advanced code quality and security analysis"], ordered: true },
      },
      {
        blockType: "HEADING",
        content: { text: "Productivity Boosters", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["GitLens - Git supercharged with blame annotations and history", "Path Intellisense - Autocomplete filenames and paths", "Auto Rename Tag - Automatically rename paired HTML/JSX tags", "Bracket Pair Colorizer - Match brackets with colors at a glance"], ordered: true },
      },
      {
        blockType: "HEADING",
        content: { text: "Collaboration", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["Live Share - Real-time collaborative editing", "Thunder Client - REST API testing without leaving VS Code"], ordered: true },
      },
      {
        blockType: "CALLOUT",
        content: { text: "Don't install every extension you find. Each extension adds overhead. Curate your toolkit based on what you actually use daily.", variant: "warning", title: "Extension Fatigue Warning" },
      },
    ],
  },
  {
    title: "The Developer's Guide to Coffee",
    slug: "developers-guide-to-coffee",
    excerpt: "A lighthearted look at developer coffee culture, from espresso shots during debugging sessions to the perfect brew for code reviews.",
    contentType: "POST",
    publishedAt: new Date("2024-01-10"),
    tags: ["coffee", "lifestyle", "humor", "culture"],
    authorEmail: "elena.rodriguez@kickass-cms.dev",
    authorRole: "PRIMARY",
    categorySlug: "lifestyle",
    featuredMediaIndex: 6,
    stateSlug: "published",
    isSystem: true,
    blocks: [
      {
        blockType: "PARAGRAPH",
        content: { text: "Coffee and code go together like semicolons and JavaScript errors. Let's explore the sacred relationship between developers and their caffeinated companions. This is mostly satire. Mostly.", format: "markdown" },
      },
      {
        blockType: "QUOTE",
        content: { text: "A programmer is just a machine that converts coffee into code. The better the coffee, the better the code. This is science.", attribution: "Ancient Developer Proverb" },
      },
      {
        blockType: "HEADING",
        content: { text: "Coffee by Task", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["Debugging: Double espresso (you'll need the focus)", "Code review: Americano (sip slowly, read carefully)", "Planning meeting: Latte (something to do with your hands)", "On-call incident: The entire pot (no judgment here)", "Friday afternoon: Decaf (pretend to work, actually browse Reddit)"], ordered: false },
      },
      {
        blockType: "HEADING",
        content: { text: "The Coffee-to-Bug Ratio", level: 2 },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "Studies show (citation needed) that there's an optimal coffee intake for code quality. Too little, and you're sluggish. Too much, and your code looks like it was written during an earthquake. The sweet spot? Approximately 2-3 cups, consumed between 9 AM and 2 PM.", format: "markdown" },
      },
      {
        blockType: "CALLOUT",
        content: { text: "Pro tip: Never debug production issues after 4 PM without caffeine. Actually, never debug production issues after 4 PM period. That's tomorrow's problem.", variant: "warning", title: "Survival Tip" },
      },
    ],
  },
  {
    title: "Introduction to TypeScript: Why Types Matter",
    slug: "intro-to-typescript",
    excerpt: "Learn why TypeScript has become essential for modern JavaScript development and how to get started with type-safe code.",
    contentType: "ARTICLE",
    publishedAt: new Date("2024-01-28"),
    tags: ["typescript", "javascript", "tutorial", "beginners"],
    authorEmail: "sarah.chen@kickass-cms.dev",
    authorRole: "PRIMARY",
    categorySlug: "tutorials",
    featuredMediaIndex: 5,
    stateSlug: "published",
    isSystem: true,
    blocks: [
      {
        blockType: "PARAGRAPH",
        content: { text: "TypeScript adds static typing to JavaScript, catching errors at compile time rather than runtime. This leads to more maintainable, self-documenting code. If you've ever spent hours debugging 'undefined is not a function', TypeScript is your new best friend.", format: "markdown" },
      },
      {
        blockType: "HEADING",
        content: { text: "Why TypeScript?", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["Catch bugs before they reach production", "Better IDE support with autocomplete and refactoring", "Self-documenting code that's easier to understand", "Gradual adoption - add types incrementally to existing projects"], ordered: false },
      },
      {
        blockType: "HEADING",
        content: { text: "Your First Type", level: 2 },
      },
      {
        blockType: "CODE",
        content: { code: "// Define an interface for your data shape\ninterface User {\n  name: string;\n  age: number;\n  email?: string;  // Optional property\n}\n\n// Now TypeScript knows exactly what a User looks like\nconst user: User = {\n  name: \"Alice\",\n  age: 30\n};\n\n// This would be a compile error:\n// user.age = \"thirty\"; // Type 'string' is not assignable to type 'number'\n\n// TypeScript also helps with functions\nfunction greet(user: User): string {\n  return `Hello, ${user.name}!`;\n}", language: "typescript", filename: "types.ts" },
      },
      {
        blockType: "HEADING",
        content: { text: "Type Inference", level: 2 },
      },
      {
        blockType: "PARAGRAPH",
        content: { text: "You don't always need to explicitly declare types. TypeScript is smart enough to infer types from context. This keeps your code clean while maintaining type safety.", format: "markdown" },
      },
      {
        blockType: "CODE",
        content: { code: "// TypeScript infers these types automatically\nconst message = \"Hello\";  // string\nconst count = 42;         // number\nconst items = [1, 2, 3];  // number[]\n\n// Function return types are also inferred\nfunction add(a: number, b: number) {\n  return a + b;  // TypeScript knows this returns number\n}", language: "typescript", filename: "inference.ts" },
      },
      {
        blockType: "CALLOUT",
        content: { text: "Start with strict mode enabled (strict: true in tsconfig.json). It's easier to start strict than to add strictness later.", variant: "success", title: "Best Practice" },
      },
    ],
  },
  {
    title: "Draft: Upcoming Features in Kickass CMS",
    slug: "upcoming-features-draft",
    excerpt: "A preview of exciting new features coming to Kickass CMS, including block-based editing and visual layouts.",
    contentType: "POST",
    publishedAt: null,
    tags: ["cms", "features", "preview"],
    authorEmail: "admin@kickass-cms.dev",
    authorRole: "PRIMARY",
    categorySlug: "news",
    featuredMediaIndex: 4,
    stateSlug: "draft",
    isSystem: true,
    blocks: [
      {
        blockType: "PARAGRAPH",
        content: { text: "We're working on some exciting new features for Kickass CMS. Here's a sneak peek at what's coming.", format: "markdown" },
      },
      {
        blockType: "CALLOUT",
        content: { text: "This content is still being written and is not yet published. You're seeing it because you have preview access.", variant: "warning", title: "Draft Content" },
      },
      {
        blockType: "HEADING",
        content: { text: "Coming Soon", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["Visual page builder with drag-and-drop", "Real-time collaborative editing", "Advanced media management with AI tagging", "Custom workflow states and approval chains"], ordered: false },
      },
    ],
  },
  {
    title: "In Review: API Design Best Practices",
    slug: "api-design-best-practices",
    excerpt: "Comprehensive guide to designing clean, consistent, and developer-friendly REST APIs.",
    contentType: "ARTICLE",
    publishedAt: null,
    tags: ["api", "rest", "design", "best-practices"],
    authorEmail: "marcus.johnson@kickass-cms.dev",
    authorRole: "PRIMARY",
    categorySlug: "tutorials",
    featuredMediaIndex: 10,
    stateSlug: "in-review",
    isSystem: true,
    blocks: [
      {
        blockType: "PARAGRAPH",
        content: { text: "A well-designed API is a joy to use. In this guide, we'll cover the principles that make APIs intuitive and maintainable.", format: "markdown" },
      },
      {
        blockType: "HEADING",
        content: { text: "Key Principles", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["Use nouns, not verbs - /users, not /getUsers", "Be consistent with naming conventions", "Version your API from day one (/v1/, /v2/)", "Provide clear, actionable error messages", "Document everything with OpenAPI/Swagger"], ordered: false },
      },
    ],
  },
  {
    title: "Approved: Cloud Native Development Patterns",
    slug: "cloud-native-patterns",
    excerpt: "Essential patterns for building resilient, scalable applications in cloud environments.",
    contentType: "ARTICLE",
    publishedAt: null,
    tags: ["cloud", "architecture", "patterns", "devops"],
    authorEmail: "sarah.chen@kickass-cms.dev",
    authorRole: "PRIMARY",
    categorySlug: "technology",
    featuredMediaIndex: 10,
    stateSlug: "approved",
    isSystem: true,
    blocks: [
      {
        blockType: "PARAGRAPH",
        content: { text: "Cloud-native development embraces the advantages of cloud computing: scalability, resilience, and flexibility. Let's explore the patterns that make cloud-native applications successful.", format: "markdown" },
      },
      {
        blockType: "HEADING",
        content: { text: "Core Patterns", level: 2 },
      },
      {
        blockType: "LIST",
        content: { items: ["Circuit Breaker - Fail fast, recover gracefully", "Bulkhead - Isolate failures to prevent cascade", "Sidecar - Separate cross-cutting concerns", "Ambassador - Proxy service communication", "Strangler Fig - Gradually migrate monoliths to microservices"], ordered: false },
      },
    ],
  },
];

// =============================================================================
// Seeding Functions
// =============================================================================

async function seedWorkflowStates(client: FlxblClient): Promise<Map<string, string>> {
  console.log("\n📊 Seeding workflow states...");
  const stateMap = new Map<string, string>();

  for (const state of workflowStates) {
    try {
      const existing = await client.query("WorkflowState", {
        where: { slug: { $eq: state.slug } },
        limit: 1,
      });

      if (existing.length > 0) {
        console.log(`  ⏭️  State "${state.name}" already exists`);
        stateMap.set(state.slug, existing[0].id);
      } else {
        const created = await client.create("WorkflowState", state);
        console.log(`  ✅ Created state: ${state.name}`);
        stateMap.set(state.slug, created.id);
      }
      await delay(DELAY_MS);
    } catch (error) {
      console.error(`  ❌ Failed to create state "${state.name}":`, error);
    }
  }

  return stateMap;
}

async function seedLayouts(client: FlxblClient): Promise<Map<string, string>> {
  console.log("\n📐 Seeding layouts...");
  const layoutMap = new Map<string, string>();

  for (const layout of layouts) {
    try {
      const existing = await client.query("Layout", {
        where: { slug: { $eq: layout.slug } },
        limit: 1,
      });

      if (existing.length > 0) {
        console.log(`  ⏭️  Layout "${layout.name}" already exists`);
        layoutMap.set(layout.slug, existing[0].id);
      } else {
        const created = await client.create("Layout", layout);
        console.log(`  ✅ Created layout: ${layout.name}`);
        layoutMap.set(layout.slug, created.id);
      }
      await delay(DELAY_MS);
    } catch (error) {
      console.error(`  ❌ Failed to create layout "${layout.name}":`, error);
    }
  }

  return layoutMap;
}

async function seedGlobalBlocks(client: FlxblClient): Promise<Map<string, string>> {
  console.log("\n🧱 Seeding global blocks...");
  const blockMap = new Map<string, string>();

  for (const block of globalBlocks) {
    try {
      const existing = await client.query("Block", {
        where: { name: { $eq: block.name } },
        limit: 1,
      });

      if (existing.length > 0) {
        console.log(`  ⏭️  Block "${block.name}" already exists`);
        blockMap.set(block.name, existing[0].id);
      } else {
        const created = await client.create("Block", block);
        console.log(`  ✅ Created block: ${block.name}`);
        blockMap.set(block.name, created.id);
      }
      await delay(DELAY_MS);
    } catch (error) {
      console.error(`  ❌ Failed to create block "${block.name}":`, error);
    }
  }

  return blockMap;
}

async function seedAuthors(client: FlxblClient): Promise<Map<string, string>> {
  console.log("\n👤 Seeding authors...");
  const authorMap = new Map<string, string>();

  for (const author of authors) {
    try {
      const existing = await client.query("Author", {
        where: { email: { $eq: author.email } },
        limit: 1,
      });

      if (existing.length > 0) {
        console.log(`  ⏭️  Author "${author.name}" already exists`);
        authorMap.set(author.email, existing[0].id);
      } else {
        const created = await client.create("Author", author);
        console.log(`  ✅ Created author: ${author.name}`);
        authorMap.set(author.email, created.id);
      }
      await delay(DELAY_MS);
    } catch (error) {
      console.error(`  ❌ Failed to create author "${author.name}":`, error);
    }
  }

  return authorMap;
}

async function seedCategories(client: FlxblClient): Promise<Map<string, string>> {
  console.log("\n📁 Seeding categories...");
  const categoryMap = new Map<string, string>();

  // First pass: create all categories
  for (const category of categories) {
    try {
      const existing = await client.query("Category", {
        where: { slug: { $eq: category.slug } },
        limit: 1,
      });

      if (existing.length > 0) {
        console.log(`  ⏭️  Category "${category.name}" already exists`);
        categoryMap.set(category.slug, existing[0].id);
      } else {
        const { parentSlug: _parentSlug, ...categoryData } = category;
        const created = await client.create("Category", categoryData);
        console.log(`  ✅ Created category: ${category.name}`);
        categoryMap.set(category.slug, created.id);
      }
      await delay(DELAY_MS);
    } catch (error) {
      console.error(`  ❌ Failed to create category "${category.name}":`, error);
    }
  }

  // Second pass: create CATEGORY_PARENT relationships
  for (const category of categories) {
    if (category.parentSlug) {
      const categoryId = categoryMap.get(category.slug);
      const parentId = categoryMap.get(category.parentSlug);

      if (categoryId && parentId) {
        try {
          // Check if relationship already exists
          const existingRels = await client.getRelationships(
            "Category",
            categoryId,
            "CATEGORY_PARENT",
            "out",
            "Category"
          );

          if (existingRels.length === 0) {
            await client.createRelationship(
              "Category",
              categoryId,
              "CATEGORY_PARENT",
              parentId,
              {}
            );
            console.log(`  🔗 Set parent for "${category.name}" -> "${category.parentSlug}"`);
          } else {
            console.log(`  ⏭️  Parent relationship already exists for "${category.name}"`);
          }
          await delay(DELAY_MS);
        } catch (error) {
          console.error(`  ❌ Failed to set parent for "${category.name}":`, error);
        }
      }
    }
  }

  return categoryMap;
}

async function seedMedia(client: FlxblClient): Promise<Map<number, string>> {
  console.log("\n🖼️  Seeding media...");
  const mediaMap = new Map<number, string>();

  for (let i = 0; i < mediaItems.length; i++) {
    const media = mediaItems[i];
    try {
      const existing = await client.query("Media", {
        where: { filename: { $eq: media.filename } },
        limit: 1,
      });

      if (existing.length > 0) {
        console.log(`  ⏭️  Media "${media.filename}" already exists`);
        mediaMap.set(i, existing[0].id);
      } else {
        const created = await client.create("Media", media);
        console.log(`  ✅ Created media: ${media.filename}`);
        mediaMap.set(i, created.id);
      }
      await delay(DELAY_MS);
    } catch (error) {
      console.error(`  ❌ Failed to create media "${media.filename}":`, error);
    }
  }

  return mediaMap;
}

async function seedContent(
  client: FlxblClient,
  authorMap: Map<string, string>,
  categoryMap: Map<string, string>,
  mediaMap: Map<number, string>,
  stateMap: Map<string, string>,
  layoutMap: Map<string, string>,
): Promise<void> {
  console.log("\n📝 Seeding content with blocks...");

  for (const content of contentItems) {
    try {
      const existing = await client.query("Content", {
        where: { slug: { $eq: content.slug } },
        limit: 1,
      });

      let contentId: string;

      if (existing.length > 0) {
        console.log(`  ⏭️  Content "${content.title}" already exists`);
        contentId = existing[0].id;
      } else {
        // Create content
        const contentData: CreateContent & { isSystem: boolean } = {
          title: content.title,
          slug: content.slug,
          excerpt: content.excerpt,
          contentType: content.contentType,
          publishedAt: content.publishedAt,
          tags: content.tags,
          metadata: {},
          isSystem: true,
        };

        const created = await client.create("Content", contentData);
        contentId = created.id;
        console.log(`  ✅ Created content: ${content.title}`);
        await delay(DELAY_MS);

        // Create content blocks
        for (let i = 0; i < content.blocks.length; i++) {
          const block = content.blocks[i];
          const blockData: CreateContentBlock & { isSystem: boolean } = {
            blockType: block.blockType,
            content: block.content,
            position: i,
            metadata: {},
            isSystem: true,
          };

          const createdBlock = await client.create("ContentBlock", blockData);
          
          // Create HAS_BLOCK relationship
          await client.createRelationship(
            "Content",
            contentId,
            "HAS_BLOCK",
            createdBlock.id,
            { position: i },
          );
          await delay(DELAY_MS / 2);
        }
        console.log(`    📦 Created ${content.blocks.length} blocks`);

        // Create author relationship
        const authorId = authorMap.get(content.authorEmail);
        if (authorId) {
          await client.createRelationship(
            "Content",
            contentId,
            "AUTHORED_BY",
            authorId,
            { role: content.authorRole, byline: null },
          );
          console.log(`    👤 Linked author`);
          await delay(DELAY_MS);
        }

        // Create category relationship
        const categoryId = categoryMap.get(content.categorySlug);
        if (categoryId) {
          await client.createRelationship(
            "Content",
            contentId,
            "CATEGORIZED_AS",
            categoryId,
            { featured: false, position: 0 },
          );
          console.log(`    📁 Linked category`);
          await delay(DELAY_MS);
        }

        // Create media relationship
        const mediaId = mediaMap.get(content.featuredMediaIndex);
        if (mediaId) {
          await client.createRelationship(
            "Content",
            contentId,
            "HAS_MEDIA",
            mediaId,
            { role: "FEATURED" as MediaRole, position: 0, caption: null },
          );
          console.log(`    🖼️  Linked featured image`);
          await delay(DELAY_MS);
        }

        // Create workflow state relationship
        const stateId = stateMap.get(content.stateSlug);
        if (stateId) {
          await client.createRelationship(
            "Content",
            contentId,
            "HAS_STATE",
            stateId,
            { assignedAt: new Date(), assignedBy: "seed-script" },
          );
          console.log(`    📊 Set workflow state: ${content.stateSlug}`);
          await delay(DELAY_MS);
        }

        // Link to default layout
        const layoutId = layoutMap.get("single-column");
        if (layoutId) {
          await client.createRelationship(
            "Content",
            contentId,
            "USES_LAYOUT",
            layoutId,
            {},
          );
          console.log(`    📐 Linked layout`);
          await delay(DELAY_MS);
        }
      }
    } catch (error) {
      console.error(`  ❌ Failed to create content "${content.title}":`, error);
    }
  }
}

// =============================================================================
// Pages
// =============================================================================

interface PageSeed extends Omit<CreatePage, "path"> {
  parentSlug?: string;
  layoutSlug?: string; // Layout to use (defaults to full-width)
  isSystem: boolean;
  sections: Array<{
    name: string;
    sectionType: PageSectionType;
    config?: Record<string, unknown>;
    globalBlockName?: string; // For GLOBAL_BLOCK section type
  }>;
  filterCategorySlugs?: string[];
  placements?: Array<{
    region: string;
    position: number;
    globalBlockName: string;
  }>;
}

const pages: PageSeed[] = [
  {
    title: "Home",
    slug: "home",
    description: "Welcome to Kickass CMS - A modern content management system powered by graph database technology",
    isPublished: true,
    showInNav: false, // Home page accessed via logo, not in nav
    navOrder: 0,
    layoutSlug: "full-width",
    isSystem: true,
    sections: [
      {
        name: "Hero Banner",
        sectionType: "GLOBAL_BLOCK",
        globalBlockName: "Homepage Hero",
        config: {},
      },
      {
        name: "Features",
        sectionType: "GLOBAL_BLOCK",
        globalBlockName: "Features Showcase",
        config: {},
      },
      {
        name: "Latest Content",
        sectionType: "CONTENT_LIST",
        config: { limit: 6, orderBy: "publishedAt", orderDirection: "DESC" },
      },
      {
        name: "Newsletter CTA",
        sectionType: "GLOBAL_BLOCK",
        globalBlockName: "Newsletter Signup",
        config: {},
      },
    ],
  },
  {
    title: "Blog",
    slug: "blog",
    description: "Latest articles and insights from our team",
    isPublished: true,
    showInNav: true,
    navOrder: 1,
    layoutSlug: "two-column-sidebar",
    isSystem: true,
    sections: [
      {
        name: "All Posts",
        sectionType: "CONTENT_LIST",
        config: { limit: 12, orderBy: "publishedAt", orderDirection: "DESC", showPagination: true, contentType: "POST" },
      },
    ],
    // Newsletter widget in sidebar
    placements: [
      { region: "sidebar", position: 0, globalBlockName: "Newsletter Signup" },
      { region: "sidebar", position: 1, globalBlockName: "Try Kickass CMS CTA" },
    ],
  },
  {
    title: "About",
    slug: "about",
    description: "Learn more about Kickass CMS and our mission to make content management enjoyable",
    isPublished: true,
    showInNav: true,
    navOrder: 2,
    layoutSlug: "single-column",
    isSystem: true,
    sections: [
      {
        name: "Our Story",
        sectionType: "STATIC_BLOCK",
        config: {
          html: `
            <div class="space-y-8">
              <div class="text-center mb-12">
                <h1 class="text-4xl font-bold mb-4">About Kickass CMS</h1>
                <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
                  We believe content management should be powerful, intuitive, and actually enjoyable to use.
                </p>
              </div>
              
              <div class="grid md:grid-cols-2 gap-8">
                <div class="space-y-4">
                  <h2 class="text-2xl font-semibold">Our Mission</h2>
                  <p>
                    Kickass CMS was born from frustration with traditional content management systems. 
                    Too often, they're either too simple to handle complex content relationships, or so 
                    complicated that teams spend more time fighting the CMS than creating content.
                  </p>
                  <p>
                    We set out to build something different—a CMS that leverages the power of graph 
                    databases to make content relationships natural and intuitive, while keeping the 
                    day-to-day experience smooth and enjoyable.
                  </p>
                </div>
                
                <div class="space-y-4">
                  <h2 class="text-2xl font-semibold">Why Graph?</h2>
                  <p>
                    Traditional relational databases force content into rigid tables and foreign keys. 
                    But real content has complex relationships—authors write multiple pieces, articles 
                    belong to multiple categories, media is reused across pages.
                  </p>
                  <p>
                    FLXBL's graph database lets us model these relationships naturally, making it easy 
                    to traverse connections, find related content, and build features that would be 
                    cumbersome with traditional approaches.
                  </p>
                </div>
              </div>
              
              <div class="bg-muted/50 rounded-lg p-8 mt-12">
                <h2 class="text-2xl font-semibold mb-4 text-center">Built With Modern Tech</h2>
                <div class="grid sm:grid-cols-3 gap-6 text-center">
                  <div>
                    <div class="text-3xl font-bold text-primary">Next.js 16</div>
                    <p class="text-sm text-muted-foreground">React framework with App Router</p>
                  </div>
                  <div>
                    <div class="text-3xl font-bold text-primary">TypeScript</div>
                    <p class="text-sm text-muted-foreground">Full type safety throughout</p>
                  </div>
                  <div>
                    <div class="text-3xl font-bold text-primary">FLXBL</div>
                    <p class="text-sm text-muted-foreground">Graph database backend</p>
                  </div>
                </div>
              </div>
            </div>
          `,
        },
      },
    ],
  },
  {
    title: "Services",
    slug: "services",
    description: "Our services and solutions",
    isPublished: true,
    showInNav: true,
    navOrder: 3,
    layoutSlug: "full-width",
    isSystem: true,
    sections: [
      {
        name: "Services Overview",
        sectionType: "STATIC_BLOCK",
        config: {
          html: `
            <div class="space-y-12">
              <div class="text-center mb-12">
                <h1 class="text-4xl font-bold mb-4">Our Services</h1>
                <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Expert solutions for modern web development and content management.
                </p>
              </div>
              
              <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div class="text-primary text-4xl mb-4">🌐</div>
                  <h3 class="text-xl font-semibold mb-2">Web Development</h3>
                  <p class="text-muted-foreground mb-4">
                    Custom web applications built with Next.js, React, and modern TypeScript. 
                    From landing pages to complex web apps.
                  </p>
                  <a href="/services/web-development" class="text-primary hover:underline">Learn more →</a>
                </div>
                
                <div class="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div class="text-primary text-4xl mb-4">🤖</div>
                  <h3 class="text-xl font-semibold mb-2">AI Solutions</h3>
                  <p class="text-muted-foreground mb-4">
                    Integrate AI capabilities into your applications. From chatbots to 
                    content generation and data analysis.
                  </p>
                  <a href="/services/ai-solutions" class="text-primary hover:underline">Learn more →</a>
                </div>
                
                <div class="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div class="text-primary text-4xl mb-4">📊</div>
                  <h3 class="text-xl font-semibold mb-2">CMS Consulting</h3>
                  <p class="text-muted-foreground mb-4">
                    Need help with your content strategy? We'll help you design schemas, 
                    workflows, and content architectures.
                  </p>
                  <a href="/contact" class="text-primary hover:underline">Get in touch →</a>
                </div>
              </div>
              
              <div class="bg-primary/5 rounded-lg p-8 text-center mt-12">
                <h2 class="text-2xl font-semibold mb-4">Ready to Start a Project?</h2>
                <p class="text-muted-foreground mb-6 max-w-xl mx-auto">
                  We'd love to hear about your project and explore how we can help bring your ideas to life.
                </p>
                <a href="/contact" class="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
                  Contact Us
                </a>
              </div>
            </div>
          `,
        },
      },
    ],
  },
  {
    title: "Web Development",
    slug: "web-development",
    description: "Custom web development services and tutorials",
    isPublished: true,
    showInNav: true,
    navOrder: 0,
    parentSlug: "services",
    layoutSlug: "two-column-sidebar",
    filterCategorySlugs: ["web-development"],
    isSystem: true,
    sections: [
      {
        name: "Web Development Articles",
        sectionType: "CONTENT_LIST",
        config: { limit: 10, orderBy: "publishedAt", orderDirection: "DESC", contentType: "ARTICLE" },
      },
    ],
    placements: [
      { region: "sidebar", position: 0, globalBlockName: "Newsletter Signup" },
    ],
  },
  {
    title: "AI Solutions",
    slug: "ai-solutions",
    description: "AI and machine learning consulting and insights",
    isPublished: true,
    showInNav: true,
    navOrder: 1,
    parentSlug: "services",
    layoutSlug: "two-column-sidebar",
    filterCategorySlugs: ["ai", "machine-learning"],
    isSystem: true,
    sections: [
      {
        name: "AI Articles",
        sectionType: "CONTENT_LIST",
        config: { limit: 10, orderBy: "publishedAt", orderDirection: "DESC", contentType: "ARTICLE" },
      },
    ],
    placements: [
      { region: "sidebar", position: 0, globalBlockName: "Newsletter Signup" },
    ],
  },
  {
    title: "Contact",
    slug: "contact",
    description: "Get in touch with us",
    isPublished: true,
    showInNav: true,
    navOrder: 4,
    layoutSlug: "single-column",
    isSystem: true,
    sections: [
      {
        name: "Contact Information",
        sectionType: "STATIC_BLOCK",
        config: {
          html: `
            <div class="max-w-2xl mx-auto space-y-8">
              <div class="text-center mb-12">
                <h1 class="text-4xl font-bold mb-4">Get in Touch</h1>
                <p class="text-xl text-muted-foreground">
                  Have a question or want to work together? We'd love to hear from you.
                </p>
              </div>
              
              <div class="grid md:grid-cols-2 gap-8">
                <div class="space-y-6">
                  <div>
                    <h3 class="font-semibold mb-2">📧 Email</h3>
                    <p class="text-muted-foreground">hello@kickass-cms.example</p>
                  </div>
                  
                  <div>
                    <h3 class="font-semibold mb-2">🐦 Twitter</h3>
                    <p class="text-muted-foreground">@kickasscms</p>
                  </div>
                  
                  <div>
                    <h3 class="font-semibold mb-2">💼 GitHub</h3>
                    <p class="text-muted-foreground">github.com/kickass-cms</p>
                  </div>
                </div>
                
                <div class="bg-muted/50 rounded-lg p-6">
                  <h3 class="font-semibold mb-4">Office Hours</h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span>Monday - Friday</span>
                      <span class="text-muted-foreground">9:00 AM - 6:00 PM</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Saturday</span>
                      <span class="text-muted-foreground">10:00 AM - 2:00 PM</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Sunday</span>
                      <span class="text-muted-foreground">Closed</span>
                    </div>
                  </div>
                  <p class="text-xs text-muted-foreground mt-4">All times in UTC</p>
                </div>
              </div>
              
              <div class="border-t pt-8 mt-8 text-center">
                <p class="text-muted-foreground">
                  <em>This is a demo CMS. Contact information shown is for demonstration purposes only.</em>
                </p>
              </div>
            </div>
          `,
        },
      },
    ],
  },
  {
    title: "Docs",
    slug: "docs",
    description: "Documentation, tutorials, and guides",
    isPublished: true,
    showInNav: true,
    navOrder: 5,
    layoutSlug: "single-column",
    filterCategorySlugs: ["tutorials"],
    isSystem: true,
    sections: [
      {
        name: "Tutorials & Guides",
        sectionType: "CONTENT_LIST",
        config: { limit: 20, orderBy: "publishedAt", orderDirection: "DESC", contentType: "ARTICLE" },
      },
    ],
  },
  {
    title: "Page Not Found",
    slug: "404",
    description: "The page you're looking for doesn't exist",
    isPublished: true,
    showInNav: false,
    navOrder: 99,
    layoutSlug: "single-column",
    isSystem: true,
    sections: [
      {
        name: "404 Content",
        sectionType: "GLOBAL_BLOCK",
        globalBlockName: "404 Not Found",
        config: {},
      },
    ],
  },
];

async function seedPages(
  client: FlxblClient,
  categoryMap: Map<string, string>,
  layoutMap: Map<string, string>,
  blockMap: Map<string, string>
): Promise<void> {
  console.log("\n📄 Seeding pages...");
  const pageMap = new Map<string, { id: string; path: string }>();

  // Helper to build path
  const buildPath = (slug: string, parentSlug?: string): string => {
    if (!parentSlug) return `/${slug}`;
    const parent = pageMap.get(parentSlug);
    return parent ? `${parent.path}/${slug}` : `/${slug}`;
  };

  // First pass: create all pages
  for (const page of pages) {
    try {
      const path = buildPath(page.slug, page.parentSlug);

      const existing = await client.query("Page", {
        where: { path: { $eq: path } },
        limit: 1,
      });

      if (existing.length > 0) {
        console.log(`  ⏭️  Page "${page.title}" already exists`);
        pageMap.set(page.slug, { id: existing[0].id, path });
      } else {
        const pageData: CreatePage & { isSystem: boolean } = {
          title: page.title,
          slug: page.slug,
          path,
          description: page.description,
          isPublished: page.isPublished,
          showInNav: page.showInNav,
          navOrder: page.navOrder,
          metadata: {
            "og:title": page.title,
            "og:description": page.description,
          },
          isSystem: true,
        };

        const created = await client.create("Page", pageData);
        console.log(`  ✅ Created page: ${page.title} (${path})`);
        pageMap.set(page.slug, { id: created.id, path });

        // Create sections
        for (let i = 0; i < page.sections.length; i++) {
          const section = page.sections[i];
          const sectionData: CreatePageSection & { isSystem: boolean } = {
            name: section.name,
            sectionType: section.sectionType,
            config: section.config || {},
            position: i,
            isSystem: true,
          };

          const createdSection = await client.create("PageSection", sectionData);

          await client.createRelationship(
            "Page",
            created.id,
            "PAGE_HAS_SECTION",
            createdSection.id,
            {}
          );
          console.log(`    📦 Created section: ${section.name}`);

          // Link global block to section if specified
          if (section.sectionType === "GLOBAL_BLOCK" && section.globalBlockName) {
            const blockId = blockMap.get(section.globalBlockName);
            if (blockId) {
              await client.createRelationship(
                "PageSection",
                createdSection.id,
                "SECTION_HAS_BLOCK",
                blockId,
                {}
              );
              console.log(`      🔗 Linked block: ${section.globalBlockName}`);
            }
          }

          await delay(DELAY_MS / 2);
        }

        // Link to specified layout (or default to full-width)
        const layoutSlug = page.layoutSlug || "full-width";
        const layoutId = layoutMap.get(layoutSlug);
        if (layoutId) {
          await client.createRelationship("Page", created.id, "PAGE_USES_LAYOUT", layoutId, {});
          console.log(`    📐 Using layout: ${layoutSlug}`);
          await delay(DELAY_MS / 2);
        }

        // Create layout placements for global blocks
        if (page.placements && page.placements.length > 0) {
          for (const placement of page.placements) {
            const blockId = blockMap.get(placement.globalBlockName);
            if (blockId) {
              try {
                // Create LayoutPlacement entity
                const placementEntity = await client.create("LayoutPlacement", {
                  region: placement.region,
                  position: placement.position,
                  settings: {},
                  isSystem: true,
                });

                // Link Page to LayoutPlacement
                await client.createRelationship(
                  "Page",
                  created.id,
                  "PAGE_HAS_PLACEMENT",
                  placementEntity.id,
                  { region: placement.region, position: placement.position }
                );

                // Link LayoutPlacement to Block
                await client.createRelationship(
                  "LayoutPlacement",
                  placementEntity.id,
                  "PLACEMENT_CONTAINS_BLOCK",
                  blockId,
                  {}
                );

                console.log(`    🧱 Added ${placement.globalBlockName} to ${placement.region}`);
                await delay(DELAY_MS / 2);
              } catch (error) {
                console.error(`  ❌ Failed to create placement for "${placement.globalBlockName}":`, error);
              }
            }
          }
        }
      }
      await delay(DELAY_MS);
    } catch (error) {
      console.error(`  ❌ Failed to create page "${page.title}":`, error);
    }
  }

  // Second pass: create parent relationships and category filters
  for (const page of pages) {
    const pageInfo = pageMap.get(page.slug);
    if (!pageInfo) continue;

    // Set parent relationship
    if (page.parentSlug) {
      const parentInfo = pageMap.get(page.parentSlug);
      if (parentInfo) {
        try {
          const existingRels = await client.getRelationships(
            "Page",
            pageInfo.id,
            "PAGE_PARENT",
            "out",
            "Page"
          );

          if (existingRels.length === 0) {
            await client.createRelationship(
              "Page",
              pageInfo.id,
              "PAGE_PARENT",
              parentInfo.id,
              {}
            );
            console.log(`  🔗 Set parent for "${page.title}" -> "${page.parentSlug}"`);
          }
          await delay(DELAY_MS);
        } catch (error) {
          console.error(`  ❌ Failed to set parent for "${page.title}":`, error);
        }
      }
    }

    // Set category filter relationships
    if (page.filterCategorySlugs && page.filterCategorySlugs.length > 0) {
      for (const categorySlug of page.filterCategorySlugs) {
        const categoryId = categoryMap.get(categorySlug);
        if (categoryId) {
          try {
            await client.createRelationship(
              "Page",
              pageInfo.id,
              "PAGE_FILTERS_CATEGORY",
              categoryId,
              {}
            );
            console.log(`    📁 Added category filter: ${categorySlug}`);
            await delay(DELAY_MS / 2);
          } catch (error) {
            console.error(`  ❌ Failed to add category filter "${categorySlug}":`, error);
          }
        }
      }
    }
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log("🚀 Kickass CMS Seed Script (v3.1.0 - System Content Protection)");
  console.log("================================================================\n");

  const config = getConfig();
  const client = createFlxblClient(config);

  console.log(`📡 Connecting to: ${config.baseUrl}`);

  try {
    // Test connection
    await client.list("Author", { limit: 1 });
    console.log("✅ Connection successful\n");
  } catch (error) {
    console.error("❌ Failed to connect to FLXBL:", error);
    process.exit(1);
  }

  // Seed data
  const stateMap = await seedWorkflowStates(client);
  const layoutMap = await seedLayouts(client);
  const blockMap = await seedGlobalBlocks(client);
  const authorMap = await seedAuthors(client);
  const categoryMap = await seedCategories(client);
  const mediaMap = await seedMedia(client);
  await seedContent(client, authorMap, categoryMap, mediaMap, stateMap, layoutMap);
  await seedPages(client, categoryMap, layoutMap, blockMap);

  console.log("\n================================================================");
  console.log("✨ Seeding complete!");
  console.log("================================================================\n");

  // Summary
  console.log("Summary:");
  console.log(`  • Workflow States: ${stateMap.size}`);
  console.log(`  • Layouts: ${layoutMap.size}`);
  console.log(`  • Global Blocks: ${blockMap.size}`);
  console.log(`  • Authors: ${authorMap.size}`);
  console.log(`  • Categories: ${categoryMap.size}`);
  console.log(`  • Media: ${mediaMap.size}`);
  console.log(`  • Content: ${contentItems.length}`);
  console.log(`  • Pages: ${pages.length}`);
  console.log("");
  console.log("🔒 All seeded content is marked with isSystem: true for demo protection.");
  console.log("");
}

main().catch(console.error);
