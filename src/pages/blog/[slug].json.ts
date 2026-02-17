/**
 * JSON endpoint for blog posts
 *
 * Serves structured post data at /blog/{slug}.json
 */

import type { APIRoute } from "astro";
import { getEntry } from "astro:content";
import type { PostData } from "../../utils/content-negotiation";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export const GET: APIRoute = async ({ params, site }) => {
  const { slug } = params;

  if (!slug) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    // Get entry
    const entry = await getEntry("docs", `blog/${slug}`);
    if (!entry) {
      return new Response("Not Found", { status: 404 });
    }

    // Read raw markdown and parse frontmatter
    const markdownPath = path.join(
      process.cwd(),
      "src",
      "content",
      "docs",
      "blog",
      `${slug}.mdx`
    );
    const fileContents = await fs.readFile(markdownPath, "utf-8");
    const { data: frontmatter, content: markdown } = matter(fileContents);

    // Build response
    const postData: PostData = {
      title: entry.data.title,
      description: entry.data.description,
      date: entry.data.date?.toISOString().split("T")[0], // Format as YYYY-MM-DD
      slug,
      url: `${site}blog/${slug}/`,
      markdown: fileContents, // Include full file with frontmatter
      // Include signatures if present in frontmatter
      signature: frontmatter.signatures
        ? {
            btc: {
              signer: frontmatter.signatures.btc.signer,
              signature: frontmatter.signatures.btc.signature,
              signatureHex: frontmatter.signatures.btc.signatureHex,
              messageHash: frontmatter.signatures.btc.messageHash,
              format: frontmatter.signatures.btc.format,
            },
            stx: {
              signer: frontmatter.signatures.stx.signer,
              signature: frontmatter.signatures.stx.signature,
              messageHash: frontmatter.signatures.stx.messageHash,
              format: frontmatter.signatures.stx.format,
            },
          }
        : undefined,
    };

    return new Response(JSON.stringify(postData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error serving JSON:", error);
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
