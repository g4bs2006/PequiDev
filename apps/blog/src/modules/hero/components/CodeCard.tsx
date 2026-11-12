import type { CSSProperties } from "react";
import { heroCode, type CodeLine, type CodeToken } from "../content";
import styles from "./CodeCard.module.css";

/** Ritmo da digitação. */
const CHAR_MS = 30;
const LINE_PAUSE_MS = 220;
const START_MS = 700;

const tokenText = (token: CodeToken) => (typeof token === "string" ? token : token[0]);

/**
 * Calcula quando cada linha começa a ser digitada. No celular as linhas
 * marcadas como desktopOnly não aparecem, então ele tem a própria contagem.
 */
function schedule(lines: CodeLine[]) {
  let desktop = START_MS;
  let mobile = START_MS;

  return lines.map((line) => {
    const length = line.tokens.reduce((total, token) => total + tokenText(token).length, 0);
    const row = { line, length, delay: desktop, mobileDelay: mobile };
    const duration = length > 0 ? length * CHAR_MS + LINE_PAUSE_MS : 0;
    desktop += duration;
    if (!line.desktopOnly) mobile += duration;
    return row;
  });
}

/**
 * Cartão de código do hero. A digitação é só CSS: cada linha é revelada letra
 * por letra com clip-path, o que funciona porque a fonte é monoespaçada.
 */
export function CodeCard({ className = "" }: { className?: string }) {
  const rows = schedule(heroCode.lines);
  const lastTyped = rows.findLastIndex((row) => row.length > 0);

  return (
    <figure
      className={`${styles.card} overflow-hidden rounded-card font-mono shadow-soft ${className}`}
    >
      <figcaption className="flex items-center justify-between px-5 pt-4 text-[0.8em]">
        <span className="rounded-full bg-creme/10 px-3 py-1">{heroCode.fileName}</span>
        <span className={styles.dim}>{heroCode.language}</span>
      </figcaption>

      <pre
        className="overflow-hidden px-5 pt-3 pb-5"
        style={{ "--char": `${CHAR_MS}ms` } as CSSProperties}
      >
        <code>
          {rows.map((row, index) => (
            <span
              key={index}
              className={`${styles.line} ${row.line.desktopOnly ? styles.desktopOnly : ""}`}
              style={
                {
                  "--n": row.length,
                  "--d": `${row.delay}ms`,
                  "--dm": `${row.mobileDelay}ms`,
                } as CSSProperties
              }
            >
              {row.length === 0 ? (
                " "
              ) : (
                <>
                  <span className={styles.text}>
                    {row.line.tokens.map((token, tokenIndex) =>
                      typeof token === "string" ? (
                        token
                      ) : (
                        <span key={tokenIndex} className={styles[token[1]]}>
                          {token[0]}
                        </span>
                      ),
                    )}
                  </span>
                  <span className={styles.caret} aria-hidden="true" />
                  {index === lastTyped ? (
                    <span className={styles.caretEnd} aria-hidden="true" />
                  ) : null}
                </>
              )}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
