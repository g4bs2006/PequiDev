import "server-only";

import { redirect } from "next/navigation";

import { createSessionClient } from "@/lib/supabase/server";

export type AdminStatus =
  | { estado: "fora" }
  | { estado: "sem-permissao"; email: string }
  | { estado: "admin"; email: string };

/**
 * Quem está usando o painel: ninguém logado, alguém logado sem permissão, ou o
 * admin. A conta é conferida no servidor do Supabase (getUser), e a permissão
 * no banco (sou_admin), que é quem manda de verdade: as regras do banco valem
 * mesmo se esta checagem falhar.
 */
export async function getAdminStatus(): Promise<AdminStatus> {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { estado: "fora" };

  const email = data.user.email ?? "";
  const { data: admin } = await supabase.rpc("sou_admin");

  return admin ? { estado: "admin", email } : { estado: "sem-permissao", email };
}

/** Para as páginas do painel: sem ser admin, vai para o login. */
export async function requireAdmin() {
  const status = await getAdminStatus();
  if (status.estado !== "admin") redirect("/admin/entrar");
  return status;
}
