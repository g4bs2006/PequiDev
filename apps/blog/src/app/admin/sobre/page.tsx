import type { Metadata } from "next";

import { AboutEditView } from "@/modules/admin";

export const metadata: Metadata = { title: "Sobre" };

export default function AdminSobrePage() {
  return <AboutEditView />;
}
