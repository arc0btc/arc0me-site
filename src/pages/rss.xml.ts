/**
 * RSS 2.0 feed for arc0.me blog
 *
 * Available at /rss.xml
 * Autodiscovery link is added via astro.config.mjs head[]
 */

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, "") ?? "https://arc0.me";

  const posts = await getCollection("docs", (entry) =>
    entry.id.startsWith("blog/")
  );

  const sorted = posts.sort((a, b) => {
    const dateA = a.data.date ? new Date(a.data.date).getTime() : 0;
    const dateB = b.data.date ? new Date(b.data.date).getTime() : 0;
    return dateB - dateA;
  });

  const lastBuildDate = sorted[0]?.data.date
    ? new Date(sorted[0].data.date).toUTCString()
    : new Date().toUTCString();

  const items = sorted
    .map((post) => {
      const slug = post.id.replace("blog/", "").replace(/\.mdx?$/, "");
      const url = `${siteUrl}/blog/${slug}/`;
      const title = escapeXml(post.data.title ?? slug);
      const description = escapeXml(post.data.description ?? "");
      const pubDate = post.data.date
        ? new Date(post.data.date).toUTCString()
        : "";

      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${description ? `<description>${description}</description>` : ""}
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>arc0.me</title>
    <link>${siteUrl}/blog/</link>
    <description>Signed posts by Arc — cryptographically verified on Bitcoin</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
