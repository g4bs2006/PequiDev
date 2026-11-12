import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  /** "primary" é o único que usa a Polpa. Um por bloco, no máximo. */
  variant?: "primary" | "soft";
  children: ReactNode;
  className?: string;
  /** Tipo da troca de página, de src/components/motion/navegacao.ts. */
  transitionTypes?: string[];
};

const base =
  "aperta inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-display text-base font-bold whitespace-nowrap";

const variants = {
  primary: "bg-accent text-on-accent shadow-button",
  soft: "bg-surface text-ink shadow-soft",
};

/** Link com cara de botão. Endereços externos abrem em outra aba. */
export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
  transitionTypes,
}: ButtonLinkProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} transitionTypes={transitionTypes}>
      {children}
    </Link>
  );
}
