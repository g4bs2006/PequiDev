import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { formatDate } from "@/lib/dates";
import { getPost, sharingCopy } from "@/modules/blog";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const spaceGrotesk = await readFile(
  join(
    process.cwd(),
    "node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff",
  ),
);
const dmSans = await readFile(
  join(process.cwd(), "node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff"),
);
const pequiData = await readFile(
  join(process.cwd(), "src/modules/blog/og/pequi-dormindo.png"),
  "base64",
);
const pequiSrc = `data:image/png;base64,${pequiData}`;

type ImageProps = {
  params: Promise<{ slug: string }>;
};

/** Texto alternativo fixo: um alt por post mudaria o endereço da imagem. */
export const alt = "Imagem de compartilhamento de um post do blog PequiDev, com o título e o Pequi dormindo";

function titleSize(title: string) {
  if (title.length > 90) return 54;
  if (title.length > 60) return 64;
  return 74;
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  const title = post?.title ?? sharingCopy.fallbackTitle;
  const fontSize = titleSize(title);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#fff4dc",
          color: "#2a2118",
          padding: "64px 72px",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            left: 0,
            height: 190,
            display: "flex",
            background: "#7cc8bf",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: 930,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Space Grotesk",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#f2a413",
            }}
          >
            {sharingCopy.brand}
          </div>

          <div
            style={{
              display: "block",
              maxHeight: fontSize * 1.02 * 3,
              marginTop: 30,
              overflow: "hidden",
              fontFamily: "Space Grotesk",
              fontSize,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              color: "#2a2118",
            }}
          >
            {title}
          </div>

          {post ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                maxWidth: 840,
                marginTop: 26,
                overflow: "hidden",
                fontFamily: "DM Sans",
                fontSize: 22,
                fontWeight: 500,
                whiteSpace: "nowrap",
                color: "#2a2118",
                opacity: 0.68,
              }}
            >
              <span>{formatDate(post.publishedAt)}</span>
              {post.tags.length > 0 ? (
                <>
                  <span style={{ margin: "0 12px" }}>·</span>
                  <span>{post.tags.map((tag) => tag.name).join(" · ")}</span>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Aqui não há next/image: o ImageResponse só desenha <img> comum. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pequiSrc}
          alt=""
          width="560"
          height="280"
          style={{
            position: "absolute",
            right: 32,
            bottom: 50,
            zIndex: 3,
            width: 560,
            height: 280,
            objectFit: "contain",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Space Grotesk",
          data: spaceGrotesk,
          style: "normal",
          weight: 700,
        },
        {
          name: "DM Sans",
          data: dmSans,
          style: "normal",
          weight: 500,
        },
      ],
    },
  );
}
