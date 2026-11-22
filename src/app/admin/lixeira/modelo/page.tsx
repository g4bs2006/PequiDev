import type { Metadata } from "next";

import { LixeiraModeloView } from "@/modules/admin";

export const metadata: Metadata = { title: "Modelo da lixeira" };

export default function AdminLixeiraModeloPage() {
  return <LixeiraModeloView />;
}
