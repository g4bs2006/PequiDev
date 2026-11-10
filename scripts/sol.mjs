#!/usr/bin/env node
/**
 * Manda uma tarefa de código para o Sol (modelo gpt-5.6-sol da OpenAI) e grava
 * os arquivos que ele devolver numa pasta de rascunho, para revisão antes de
 * entrar no projeto. Ver docs/sol.md.
 *
 * Uso:
 *   OPENAI_API_KEY=... node scripts/sol.mjs <tarefa.md> <pasta-de-saída> [arquivos de contexto...]
 *
 * - <tarefa.md>: a especificação, em Markdown.
 * - <pasta-de-saída>: onde gravar o que ele escrever (os caminhos dele ficam
 *   relativos a ela). Nada é gravado direto no projeto.
 * - Arquivos de contexto: código do projeto e docs do Next que ele precisa ler.
 *   Nunca passe .env nem nada com segredo.
 *
 * Variáveis opcionais: SOL_MODEL (padrão gpt-5.6-sol), SOL_EFFORT (padrão high).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize, relative } from "node:path";

const [taskPath, outDir, ...contextPaths] = process.argv.slice(2);
const key = process.env.OPENAI_API_KEY;
const model = process.env.SOL_MODEL ?? "gpt-5.6-sol";
const effort = process.env.SOL_EFFORT ?? "high";

if (!taskPath || !outDir) {
  console.error("Uso: node scripts/sol.mjs <tarefa.md> <pasta-de-saída> [contexto...]");
  process.exit(1);
}
if (!key) {
  console.error("Defina OPENAI_API_KEY antes de rodar.");
  process.exit(1);
}
for (const path of contextPaths) {
  if (/(^|[\\/])\.env/.test(path)) {
    console.error(`Recusado: ${path} parece um arquivo de segredos.`);
    process.exit(1);
  }
}

const guide = `Você é o Sol, desenvolvedor do PequiDev (Next.js 16 com App Router, React 19.3, TypeScript, Tailwind CSS 4, Supabase). Siga à risca a especificação e as convenções do projeto mostradas no contexto:
- Next.js 16 tem mudanças em relação ao que você conhece: use só as APIs mostradas nos trechos de documentação do contexto.
- Código, comentários e textos visíveis em português do Brasil, no mesmo tom do código de contexto. Comentários explicam o porquê, curtos.
- Cores, fontes e movimento só pelos tokens do projeto (classes do Tailwind como bg-surface, text-ink, font-display; utilitários aperta, sobe, tinge, surge). Nada de cor solta.
- Módulos em src/modules/<nome> expõem o público pelo index.ts; páginas em src/app só montam módulos.
- Acessibilidade: teclado, foco visível, textos alternativos, prefers-reduced-motion.
- Não invente dependências: use só o que já existe no projeto, a menos que a especificação permita.
Responda só com o JSON pedido. Em "files", cada arquivo vem inteiro, com o caminho relativo à raiz do projeto. Em "notes", explique em poucas linhas o que fez e o que ficou em aberto.`;

const context = await Promise.all(
  contextPaths.map(async (path) => `\n\n===== ${path} =====\n${await readFile(path, "utf8")}`),
);
const task = await readFile(taskPath, "utf8");

const body = {
  model,
  reasoning: { effort },
  input: [
    { role: "developer", content: guide },
    { role: "user", content: `# Contexto do projeto${context.join("")}\n\n# Tarefa\n\n${task}` },
  ],
  text: {
    format: {
      type: "json_schema",
      name: "entrega",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["files", "notes"],
        properties: {
          notes: { type: "string" },
          files: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["path", "content"],
              properties: { path: { type: "string" }, content: { type: "string" } },
            },
          },
        },
      },
    },
  },
};

const started = Date.now();
const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const data = await response.json();
if (!response.ok) {
  console.error(`A OpenAI recusou (${response.status}): ${JSON.stringify(data.error ?? data)}`);
  process.exit(1);
}

const text = data.output
  ?.flatMap((item) => item.content ?? [])
  .find((part) => part.type === "output_text")?.text;
if (!text) {
  console.error("Resposta sem texto:", JSON.stringify(data).slice(0, 500));
  process.exit(1);
}

const { files, notes } = JSON.parse(text);
for (const file of files) {
  const target = normalize(join(outDir, file.path));
  if (relative(outDir, target).startsWith("..")) {
    console.error(`Ignorado (fora da pasta): ${file.path}`);
    continue;
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, file.content);
  console.log(`gravado ${relative(process.cwd(), target)}`);
}

await writeFile(join(outDir, "_notas-do-sol.md"), notes);
const usage = data.usage ?? {};
console.log(
  `\n${files.length} arquivo(s) em ${Math.round((Date.now() - started) / 1000)}s · tokens: entrada ${usage.input_tokens ?? "?"}, saída ${usage.output_tokens ?? "?"}`,
);
console.log(`\nNotas do Sol:\n${notes}`);
