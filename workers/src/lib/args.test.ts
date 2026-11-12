import { describe, expect, it } from "vitest";
import { parseCliArgs, UsageError } from "./args.js";

describe("parseCliArgs", () => {
  it("lê tarefa, fonte e board", () => {
    expect(parseCliArgs(["scrape", "--source", "gupy", "--board", "empresa"])).toEqual({
      task: "scrape",
      source: "gupy",
      board: "empresa",
    });
  });

  it("aceita só a tarefa", () => {
    expect(parseCliArgs(["score"])).toEqual({ task: "score", source: undefined, board: undefined });
  });

  it("devolve help com -h", () => {
    expect(parseCliArgs(["-h"])).toBe("help");
  });

  it.each([
    [[], "Faltou a tarefa."],
    [["voar"], "Tarefa desconhecida: voar"],
    [["scrape", "extra"], "Argumentos sobrando: extra"],
    [["scrape", "--board", "x"], "--board precisa de --source."],
  ])("recusa %j", (argv, message) => {
    expect(() => parseCliArgs(argv)).toThrow(new UsageError(message));
  });

  it("recusa opção desconhecida", () => {
    expect(() => parseCliArgs(["scrape", "--linkedin"])).toThrow();
  });
});
