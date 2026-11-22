import type { Metadata } from "next";
import { RegistrarApp } from "@/modules/lixeira";

/** A lixeira é um app instalável à parte do site (manifest e service worker próprios). */
export const metadata: Metadata = {
  manifest: "/lixeira/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Lixeira", statusBarStyle: "default" },
  icons: { apple: "/lixeira/icone-192.png" },
};

export default function LixeiraLayout({ children }: LayoutProps<"/lixeira">) {
  return (
    <>
      <RegistrarApp />
      {children}
    </>
  );
}
