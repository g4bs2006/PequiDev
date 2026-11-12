import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { palette } from "./tokens";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

describe("tokens", () => {
  it.each(Object.entries(palette))("tokens.css define --%s igual a tokens.ts", (name, hex) => {
    const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
    expect(match?.[1]?.toLowerCase()).toBe(hex.toLowerCase());
  });
});
