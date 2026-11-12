import Image from "next/image";
import Link from "next/link";
import pequiIcon from "@/app/icon.png";
import { NavLink } from "@/components/molecules/NavLink";
import { ThemeToggle } from "@/components/molecules/ThemeToggle";
import { site } from "@/lib/site";

/**
 * Menu do topo. Fica por cima do começo da página, então cada página reserva
 * a altura dele com var(--nav-h).
 */
export function Navbar() {
  return (
    <header data-plataforma="base" className="absolute inset-x-0 top-0 z-30 h-(--nav-h)">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-full max-w-[84rem] items-center justify-between gap-2 px-4 md:px-10"
      >
        <Link
          href="/"
          aria-label={`${site.name}, página inicial`}
          className="flex items-center gap-2.5 rounded-full font-display text-lg font-bold text-ink"
        >
          <Image src={pequiIcon} alt="" width={40} height={40} className="size-10 rounded-full" />
          <span className="max-sm:hidden">{site.name}</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <ul className="flex items-center sm:gap-1">
            {site.nav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
