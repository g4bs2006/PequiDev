import type { Metadata, Viewport } from "next";
import { fontVariables } from "@pequidev/ui/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "PequiDev Vagas",
  description: "Área privada.",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#FFF4DC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={fontVariables}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
