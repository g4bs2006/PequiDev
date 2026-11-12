import type { Metadata } from "next";

import { PostEditView } from "@/modules/admin";

export const metadata: Metadata = { title: "Editar post" };

export default async function EditarPostPage({
  params,
  searchParams,
}: PageProps<"/admin/posts/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <PostEditView id={id} created={query.criado === "1"} />;
}
