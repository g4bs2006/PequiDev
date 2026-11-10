import Link from "next/link";

type NavLinkProps = {
  href: string;
  children: string;
};

export function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-2 font-medium text-ink transition-colors duration-200 hover:bg-ink/10 sm:px-4"
    >
      {children}
    </Link>
  );
}
