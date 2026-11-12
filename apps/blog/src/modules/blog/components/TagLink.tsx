import Link from "next/link";

import { navegacao } from "@/components/motion/navegacao";

import type { Tag } from "../types";

/** Uma tag que leva à lista dos posts publicados com ela. */
export function TagLink({ tag }: { tag: Tag }) {
  return (
    <Link
      href={`/blog/tag/${tag.slug}`}
      transitionTypes={navegacao.avanca}
      className="tinge relative z-10 inline-flex items-center rounded-full bg-tag/15 px-3 py-1 text-sm font-medium text-tag hover:bg-tag/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tag"
    >
      {tag.name}
    </Link>
  );
}
