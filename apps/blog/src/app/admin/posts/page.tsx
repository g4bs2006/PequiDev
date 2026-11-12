import type { Metadata } from "next";

import { PostsListView } from "@/modules/admin";

export const metadata: Metadata = { title: "Posts" };

export default function AdminPostsPage() {
  return <PostsListView />;
}
