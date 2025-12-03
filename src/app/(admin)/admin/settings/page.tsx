import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Zap, Database, Palette, Shield } from "lucide-react";

// =============================================================================
// Settings Page
// =============================================================================

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your CMS settings and preferences.
        </p>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5" />
              General
            </CardTitle>
            <CardDescription>
              Basic site configuration and branding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Badge variant="secondary">Coming in Phase 3</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              Schema
            </CardTitle>
            <CardDescription>
              FLXBL schema version and entity configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Schema Version</span>
                <Badge variant="outline">v2.0.0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Entities</span>
                <Badge variant="secondary">10</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Relationships</span>
                <Badge variant="secondary">15</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Theme customization and UI preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Badge variant="secondary">Coming in Phase 3</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5" />
              Security
            </CardTitle>
            <CardDescription>
              Authentication and access control settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication</span>
                <Badge variant="outline">Stubbed</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Current User</span>
                <Badge variant="secondary">Mock Admin</Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Real authentication will be implemented with NextAuth.js or Clerk in a future phase.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Framework</p>
              <p className="font-medium">Next.js 16</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Database</p>
              <p className="font-medium">FLXBL Graph DB</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Styling</p>
              <p className="font-medium">Tailwind CSS v4</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">UI Components</p>
              <p className="font-medium">shadcn/ui</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

