/**
 * Markdown endpoint for blog posts
 *
 * Serves raw markdown source at /blog/{slug}.md
 */

import type { APIRoute } from "astro";
import { getEntry } from "astro:content";
import fs from "node:fs/promises";
import path from "node:path";

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;

  if (!slug) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    // Verify entry exists
    const entry = await getEntry("docs", `blog/${slug}`);
    if (!entry) {
      return new Response("Not Found", { status: 404 });
    }

    // Read raw markdown
    const markdownPath = path.join(
      process.cwd(),
      "src",
      "content",
      "docs",
      "blog",
      `${slug}.mdx`
    );
    const markdown = await fs.readFile(markdownPath, "utf-8");

    return new Response(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error serving markdown:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

// Generate static paths for all blog posts
export async function getStaticPaths() {
  const { getCollection } = await import("astro:content");
  const posts = await getCollection("docs", (entry) =>
    entry.id.startsWith("blog/")
  );

  return posts.map((post) => {
    // post.id is like "blog/hello-world.mdx", extract the slug
    const slug = post.id.replace("blog/", "").replace(".mdx", "");
    return {
      params: { slug },
    };
  });
}
