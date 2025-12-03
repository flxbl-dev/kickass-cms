import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Redirect from legacy /posts/[slug] route to /blog/[slug]
 * Content display is now graph-driven via dynamic routes
 */
export default async function PostSlugRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/blog/${slug}`);
}

