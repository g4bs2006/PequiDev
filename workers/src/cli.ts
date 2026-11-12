/**
 * Entrada dos workers: `pnpm worker <tarefa> [--source x] [--board y]`.
 * Na Fase 0 só valida os argumentos; as tarefas chegam nas Fases 2, 3 e 6.
 */
import { parseCliArgs, USAGE } from "./lib/args.js";

function main(argv: readonly string[]): number {
  let args;
  try {
    args = parseCliArgs(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${message}\n\n${USAGE}`);
    return 2;
  }

  if (args === "help") {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  console.error(`A tarefa "${args.task}" ainda não foi implementada (ver docs/PLANO.md).`);
  return 1;
}

process.exitCode = main(process.argv.slice(2));
