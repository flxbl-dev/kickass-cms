# Getting Started

This guide will help you set up and run Kickass CMS locally.

## Prerequisites

- **Node.js** 20.x or later
- **pnpm** 8.x or later (recommended) or npm
- **FLXBL Account** with API credentials

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd kickass-cms
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp env.example .env.local
```

Edit `.env.local` with your FLXBL credentials:

```bash
# FLXBL API Base URL
FLXBL_BASE_URL=https://api.flxbl.dev

# FLXBL API Key (get from FLXBL dashboard)
FLXBL_API_KEY=your_api_key_here
```

### 4. Seed Demo Data (Optional)

To populate the database with sample content:

```bash
pnpm seed
```

This creates:
- Sample authors (writers, editors)
- Categories (Technology, Lifestyle, etc.)
- Demo posts and articles
- Workflow states
- Media items

> **Note**: Seeded content is marked as "system content" and cannot be modified or deleted to preserve the demo environment.

### 5. Start the Development Server

```bash
pnpm dev
```

The application will be available at:
- **Public site**: http://localhost:3000
- **Admin panel**: http://localhost:3000/admin

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin route group
│   │   └── admin/         # Admin pages
│   ├── api/               # API route handlers
│   └── posts/             # Public content pages
├── components/
│   ├── admin/             # Admin-specific components
│   ├── blocks/            # Content block renderers
│   ├── editor/            # Tiptap block editor
│   └── ui/                # shadcn/ui components
└── lib/
    └── flxbl/             # FLXBL API client library
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm seed` | Seed demo data |

## Next Steps

- [Content Management](content-management.md) - Learn about content types and workflow
- [Admin Interface Guide](admin-guide.md) - Explore the admin panel
- [Developer Guide](developer-guide.md) - Understand the architecture

## Troubleshooting

### Port Already in Use

If port 3000 is taken, Next.js will automatically use the next available port (e.g., 3001).

### Environment Variables Not Loading

Ensure your `.env.local` file is in the project root and contains valid credentials. The FLXBL client will throw an error on startup if credentials are missing.

### Database Connection Issues

Verify your FLXBL API key is correct and the service is accessible. Check the [FLXBL documentation](https://flxbl.dev/docs) for status updates.

