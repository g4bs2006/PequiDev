import { PageTransition } from "@/components/motion/PageTransition";
import { BlogIndex, blogIndexMetadata } from "@/modules/blog";

export const metadata = blogIndexMetadata;

export default function BlogPage() {
  return (
    <PageTransition>
      <BlogIndex />
    </PageTransition>
  );
}
