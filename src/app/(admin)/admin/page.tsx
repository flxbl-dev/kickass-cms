import Link from "next/link";
import { getFlxblClient } from "@/lib/flxbl/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Image,
  FolderTree,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";

// =============================================================================
// Dashboard Stats
// =============================================================================

async function getDashboardStats() {
  const client = getFlxblClient();

  try {
    // Fetch all entities without limit to get accurate counts
    const [content, authors, categories, media, states] = await Promise.all([
      client.list("Content", { orderBy: "updatedAt", orderDirection: "DESC" }),
      client.list("Author"),
      client.list("Category"),
      client.list("Media"),
      client.list("WorkflowState", { orderBy: "position", orderDirection: "ASC" }),
    ]);

    return {
      totalContent: content.length,
      totalAuthors: authors.length,
      totalCategories: categories.length,
      totalMedia: media.length,
      recentContent: content.slice(0, 5),
      states,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalContent: 0,
      totalAuthors: 0,
      totalCategories: 0,
      totalMedia: 0,
      recentContent: [],
      states: [],
    };
  }
}

// =============================================================================
// Stat Card Component
// =============================================================================

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

function StatCard({ title, value, description, icon: Icon, href }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <Link
          href={href}
          className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
        >
          View all
          <ArrowRight className="ml-1 size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Dashboard Page
// =============================================================================

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Kickass CMS admin panel.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/content/new">
            <Plus className="mr-2 size-4" />
            New Content
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Content"
          value={stats.totalContent}
          description="Pages, posts, and articles"
          icon={FileText}
          href="/admin/content"
        />
        <StatCard
          title="Media Files"
          value={stats.totalMedia}
          description="Images, videos, and documents"
          icon={Image}
          href="/admin/media"
        />
        <StatCard
          title="Categories"
          value={stats.totalCategories}
          description="Content organization"
          icon={FolderTree}
          href="/admin/categories"
        />
        <StatCard
          title="Authors"
          value={stats.totalAuthors}
          description="Content creators"
          icon={Users}
          href="/admin/authors"
        />
      </div>

      {/* Recent Content & Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Recent Content
            </CardTitle>
            <CardDescription>
              Latest content items added to the CMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentContent.length > 0 ? (
              <div className="space-y-3">
                {stats.recentContent.map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/content/${item.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium leading-none">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.contentType} • {new Date(item.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{item.contentType}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="mx-auto size-8 mb-2 opacity-50" />
                <p>No content yet.</p>
                <p className="text-xs">Create your first content item to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow States */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow States</CardTitle>
            <CardDescription>
              Content lifecycle states configured in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.states.length > 0 ? (
              <div className="space-y-3">
                {stats.states.map((state) => (
                  <div
                    key={state.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-3 rounded-full"
                        style={{ backgroundColor: state.color }}
                      />
                      <div>
                        <p className="font-medium">{state.name}</p>
                        {state.description && (
                          <p className="text-xs text-muted-foreground">
                            {state.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">
                      Position {state.position}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No workflow states configured.</p>
                <p className="text-xs">Run the seed script to set up default states.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

