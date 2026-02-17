/**
 * API endpoint for blog post listing
 *
 * Returns JSON array of all blog posts with metadata
 */

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import type { PostMetadata } from "../../utils/content-negotiation";

export const GET: APIRoute = async ({ site }) => {
  try {
    // Get all blog posts
    const posts = await getCollection("docs", (entry) =>
      entry.id.startsWith("blog/")
    );

    // Sort by date (newest first)
    const sortedPosts = posts.sort((a, b) => {
      const dateA = a.data.date ? new Date(a.data.date).getTime() : 0;
      const dateB = b.data.date ? new Date(b.data.date).getTime() : 0;
      return dateB - dateA;
    });

    // Build metadata array
    const postList: PostMetadata[] = sortedPosts.map((post) => {
      const slug = post.id.replace("blog/", "").replace(".mdx", "");
      return {
        title: post.data.title,
        description: post.data.description,
        date: post.data.date?.toISOString().split("T")[0], // Format as YYYY-MM-DD
        slug,
        url: `${site}blog/${slug}/`,
      };
    });

    return new Response(JSON.stringify(postList, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
