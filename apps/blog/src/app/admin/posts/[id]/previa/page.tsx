import type { Metadata } from "next";

import { PostPreviewView } from "@/modules/admin";

export const metadata: Metadata = { title: "Prévia do post" };

export default async function PreviaPostPage({ params }: PageProps<"/admin/posts/[id]/previa">) {
  const { id } = await params;
  return <PostPreviewView id={id} />;
}
