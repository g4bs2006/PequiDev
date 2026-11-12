import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Cliente do Supabase no navegador, com a mesma sessão do painel (os cookies
 * que o login gravou). Usado só para enviar imagens ao Storage direto do
 * navegador, sem passar o arquivo pelo servidor.
 */
export function getBrowserClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Faltam as variáveis do Supabase.");
    client = createBrowserClient<Database>(url, key);
  }
  return client;
}
