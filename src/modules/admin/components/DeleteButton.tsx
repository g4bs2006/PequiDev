"use client";

import { useFormStatus } from "react-dom";

function Button({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="tinge cursor-pointer rounded-full px-4 py-2 font-medium text-danger hover:bg-danger/10 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Apagando…" : children}
    </button>
  );
}

type DeleteButtonProps = {
  /** A Server Action já com o id preso (apagarPost.bind(null, id)). */
  action: () => Promise<void>;
  /** O que aparece na pergunta: "o post X". */
  what: string;
};

/** Apagar, com confirmação. Não tem volta: some do site e do banco. */
export function DeleteButton({ action, what }: DeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Apagar ${what}? Não dá para desfazer.`)) event.preventDefault();
      }}
    >
      <Button>Apagar</Button>
    </form>
  );
}
