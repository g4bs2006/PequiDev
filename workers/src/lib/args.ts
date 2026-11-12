import { parseArgs } from "node:util";

/** Tarefas que o CLI conhece. Cada fase do plano acrescenta as suas. */
export const TASKS = ["scrape", "discovery", "score"] as const;
export type Task = (typeof TASKS)[number];

export interface CliArgs {
  task: Task;
  source?: string;
  board?: string;
}

export class UsageError extends Error {}

export const USAGE = `Uso: pnpm worker <tarefa> [opções]

Tarefas:
  scrape      coleta vagas (Fase 2)
  discovery   descobre boards de ATS (Fase 3)
  score       filtra e ranqueia vagas (Fase 6)

Opções:
  --source <chave>   fonte, ex.: gupy
  --board <slug>     só um board da fonte
  -h, --help         mostra esta ajuda`;

function isTask(value: string): value is Task {
  return (TASKS as readonly string[]).includes(value);
}

/** Lê os argumentos do CLI. Lança UsageError com a mensagem para o usuário. */
export function parseCliArgs(argv: readonly string[]): CliArgs | "help" {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    strict: true,
    options: {
      source: { type: "string" },
      board: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) return "help";

  const [task, ...rest] = positionals;
  if (!task) throw new UsageError("Faltou a tarefa.");
  if (!isTask(task)) throw new UsageError(`Tarefa desconhecida: ${task}`);
  if (rest.length > 0) throw new UsageError(`Argumentos sobrando: ${rest.join(" ")}`);
  if (values.board && !values.source) throw new UsageError("--board precisa de --source.");

  return { task, source: values.source, board: values.board };
}
