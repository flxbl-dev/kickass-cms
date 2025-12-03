import { redirect } from "next/navigation";

/**
 * Redirect from legacy /posts route to /blog
 * The /blog page is now graph-driven via the Page entity
 */
export default function PostsRedirect() {
  redirect("/blog");
}

