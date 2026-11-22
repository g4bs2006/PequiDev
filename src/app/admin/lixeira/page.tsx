import type { Metadata } from "next";

import { LixeiraRevisaoView } from "@/modules/admin";

export const metadata: Metadata = { title: "Lixeira" };

export default function AdminLixeiraPage() {
  return <LixeiraRevisaoView />;
}
