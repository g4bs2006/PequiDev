/** Entrega os posts mais recentes em um feed RSS 2.0. */
import { site } from "@/lib/site";
import { getPosts } from "@/modules/blog";

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return character;
    }
  });
}

export async function GET() {
  const posts = await getPosts(20);
  const feedUrl = new URL("/feed.xml", site.url).toString();
  const newestPost = posts[0];

  const items = posts.map((post) => {
    const postUrl = new URL(`/blog/${post.slug}`, site.url).toString();
    const categories = post.tags
      .map((tag) => `      <category>${escapeXml(tag.name)}</category>`)
      .join("\n");

    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <pubDate>${escapeXml(new Date(post.publishedAt).toUTCString())}</pubDate>
      <description>${escapeXml(post.summary)}</description>${categories ? `\n${categories}` : ""}
    </item>`;
  });

  const channelLines = [
    `    <title>${escapeXml(site.name)}</title>`,
    `    <link>${escapeXml(site.url)}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    "    <language>pt-BR</language>",
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    ...(newestPost
      ? [
          `    <lastBuildDate>${escapeXml(new Date(newestPost.publishedAt).toUTCString())}</lastBuildDate>`,
        ]
      : []),
    ...items,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
${channelLines.join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
