import type { CSSProperties } from "react";
import sprite from "../data/sprite.json";
import styles from "./SpritePreview.module.css";

type AnimationName = keyof typeof sprite.animacoes;

const LABELS: Record<AnimationName, string> = {
  parado: "Parado",
  caminhada: "Caminhada",
  pulo: "Pulo",
  patada: "Patada",
  dormir: "Deitar e dormir",
  sentar: "Sentar",
  lamber: "Lamber a pata",
};

const columns = Math.max(...Object.values(sprite.animacoes).map((a) => a.quadros));

/** Variáveis que o CSS usa para recortar e tocar uma linha da folha. */
function spriteVars(name: AnimationName, scale: number): CSSProperties {
  const anim = sprite.animacoes[name];
  return {
    "--folha": `url("${sprite.imagem}")`,
    "--cel-w": sprite.celula.largura,
    "--cel-h": sprite.celula.altura,
    "--colunas": columns,
    "--linha": anim.linha,
    "--quadros": anim.quadros,
    "--duracao": `${anim.quadros / anim.fps}s`,
    "--escala": scale,
  } as CSSProperties;
}

/** Um quadro parado da folha, para ver o desenho de perto. */
function frameVars(name: AnimationName, frame: number): CSSProperties {
  return { ...spriteVars(name, 1), "--quadro": frame } as CSSProperties;
}

/**
 * Prévia da folha de sprites do Pequi: cada animação tocando em loop, os
 * quadros soltos e ele andando de um lado para o outro.
 */
export function SpritePreview() {
  const names = Object.keys(sprite.animacoes) as AnimationName[];

  return (
    <div className="grid gap-10" data-pequi-casa>
      <div className={styles.lane} aria-hidden="true">
        <div className={styles.walker}>
          <div className={styles.sprite} style={spriteVars("caminhada", 2)} />
        </div>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {names.map((name) => {
          const anim = sprite.animacoes[name];
          return (
            <li key={name} className="rounded-card bg-surface p-5 shadow-soft">
              <div className={styles.stage}>
                <div
                  className={styles.sprite}
                  style={spriteVars(name, 3)}
                  role="img"
                  aria-label={`Pequi em pixel art: ${LABELS[name].toLowerCase()}`}
                />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{LABELS[name]}</h3>
              <p className="text-sm text-ink-soft">
                {anim.quadros} quadros · {anim.fps} por segundo ·{" "}
                {anim.repete ? "repete" : "toca uma vez no jogo"}
              </p>
              <div className={styles.frames} aria-hidden="true">
                {Array.from({ length: anim.quadros }, (_, i) => (
                  <div key={i} className={styles.frame} style={frameVars(name, i)} />
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-card bg-surface p-5 shadow-soft">
        <h3 className="font-display text-xl font-bold">Paleta</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {sprite.paleta.map((cor) => (
            <li
              key={cor}
              className="size-9 rounded-lg border border-ink/15"
              style={{ background: cor }}
              title={cor}
            >
              <span className="sr-only">{cor}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
