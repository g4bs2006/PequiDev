import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

/**
 * Cliente do Supabase com a sessão de quem está logado (painel admin), lida dos
 * cookies da requisição. Quem escreve no banco passa por aqui, e as regras do
 * banco (RLS) decidem o que essa sessão pode fazer.
 *
 * Em Server Components os cookies não podem ser gravados; a sessão renovada é
 * gravada pelo proxy (src/proxy.ts) e pelas Server Actions.
 */
export async function createSessionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Faltam as variáveis do Supabase no .env.local.");

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) cookieStore.set(name, value, options);
        } catch {
          // Chamado de um Server Component: o proxy grava a sessão renovada.
        }
      },
    },
  });
}
