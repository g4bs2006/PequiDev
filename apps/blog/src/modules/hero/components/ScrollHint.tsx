import Link from "next/link";
import { ArrowDownIcon } from "@/components/atoms/icons";
import { heroCopy } from "../content";
import styles from "./Hero.module.css";

/** A setinha de "role pra baixo" que fica balançando embaixo da pata do Pequi. */
export function ScrollHint() {
  const { label, href } = heroCopy.scrollHint;

  return (
    <Link
      href={href}
      className={`${styles.hint} grid size-10 place-items-center rounded-full bg-accent text-xl text-on-accent shadow-button md:size-12 md:text-2xl`}
    >
      <ArrowDownIcon />
      <span className="sr-only">{label}</span>
    </Link>
  );
}
