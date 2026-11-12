"use client";

import { useActionState } from "react";

import { entrar, type FormState } from "../actions";
import { Field, FormMessage, inputClass, SubmitButton } from "./fields";

/** Login do painel: e-mail e senha da conta do Supabase. */
export function LoginForm({ notice }: { notice?: string }) {
  const [state, action] = useActionState<FormState, FormData>(entrar, {});

  return (
    <form action={action} className="grid gap-6">
      {notice ? <p className="rounded-2xl bg-danger/10 px-4 py-3 text-ink">{notice}</p> : null}

      <Field label="E-mail" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </Field>

      <Field label="Senha" htmlFor="senha">
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending="Entrando…">Entrar</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
