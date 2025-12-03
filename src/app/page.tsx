import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { ArrowRight, BookOpen, Layers, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Graph-Driven Navigation Header */}
      <SiteHeader showAdminLink />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="container mx-auto px-6 py-24 sm:py-32">
            <div className="flex flex-col items-center gap-8 text-center">
              <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Finally, a CMS with{" "}
                <span className="text-primary">node strings attached</span>
              </h1>

              <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                A modern CMS built with Next.js 16, powered by a graph database.
                Type-safe, blazingly fast, and actually enjoyable to use.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/home">
                    Enter Demo
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/admin">
                    Admin Dashboard
                  </Link>
                </Button>
              </div>

              <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
                Clicking &quot;Enter Demo&quot; takes you into the graph-powered CMS.
                All pages, articles, and navigation are dynamically rendered from FLXBL.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <Layers className="size-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Block Editor</h3>
                <p className="text-muted-foreground">
                  Rich content editing with Tiptap 3. Drag-and-drop blocks,
                  media embeds, and real-time preview out of the box.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <Shield className="size-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Type-Safe</h3>
                <p className="text-muted-foreground">
                  Full TypeScript support with Zod validation. Catch errors at
                  build time, not runtime.
                </p>
              </div>

              <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <BookOpen className="size-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Graph-Powered</h3>
                <p className="text-muted-foreground">
                  Complex content relationships made simple with FLXBL graph
                  database backend.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Graph-Driven Footer */}
      <SiteFooter />
    </div>
  );
}
