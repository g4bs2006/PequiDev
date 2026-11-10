import type { Metadata } from "next";

import { PostNewView } from "@/modules/admin";

export const metadata: Metadata = { title: "Novo post" };

export default function NovoPostPage() {
  return <PostNewView />;
}
