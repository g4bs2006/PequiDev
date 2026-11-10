import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Cliente de leitura pública do Supabase, sem sessão: enxerga só o que as
 * regras do banco liberam para visitantes (posts e projetos publicados).
 * Só os arquivos queries.ts dos módulos devem chamar isto.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Copie .env.example para .env.local e preencha os dois valores.",
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
