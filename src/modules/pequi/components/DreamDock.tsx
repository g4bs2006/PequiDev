"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

/** O anfitrião só baixa no navegador, sem pesar na renderização inicial. */
const DreamHost = dynamic(
  () => import("./DreamHost").then((module) => module.DreamHost),
  { ssr: false },
);

export function DreamDock() {
  if (usePathname().startsWith("/lixeira")) return null;
  return <DreamHost />;
}
