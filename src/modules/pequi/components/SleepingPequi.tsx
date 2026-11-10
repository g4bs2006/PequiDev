import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import geometry from "../data/dormindo.json";
import styles from "./SleepingPequi.module.css";

type Part = typeof geometry.paw;

const percent = (value: number) => `${(value * 100).toFixed(3)}%`;

/** Posiciona uma parte pendurada e põe o eixo de giro onde ela encontra o corpo. */
function partStyle(part: Part): CSSProperties {
  return {
    left: percent(part.left),
    top: percent(part.top),
    width: percent(part.width),
    height: percent(part.height),
    transformOrigin: `${percent(part.originX)} ${percent(part.originY)}`,
  };
}

type SleepingPequiProps = {
  /** Largura que o Pequi ocupa na tela, no formato do atributo sizes. */
  sizes: string;
  /** O que fica logo abaixo da pata pendurada e que ele tenta alcançar. */
  pawTarget?: ReactNode;
};

/**
 * O Pequi dormindo, em três camadas: rabo e pata por baixo, corpo por cima
 * cobrindo as emendas. Ocupa a largura do elemento pai. A linha de apoio (onde
 * o corpo encosta) fica em `sleepingPequi.rise` da largura, a partir do topo.
 */
export function SleepingPequi({ sizes, pawTarget }: SleepingPequiProps) {
  return (
    <div
      data-pequi-casa
      className={styles.pequi}
      style={{ aspectRatio: `${geometry.width} / ${geometry.height}` }}
    >
      <div className={`${styles.part} ${styles.tail}`} style={partStyle(geometry.tail)}>
        <Image src="/pequi/dormindo-rabo.webp" alt="" fill sizes="10vw" loading="eager" />
      </div>

      <div className={`${styles.part} ${styles.paw}`} style={partStyle(geometry.paw)}>
        <Image src="/pequi/dormindo-pata.webp" alt="" fill sizes="18vw" loading="eager" />
      </div>

      <div
        className={styles.body}
        style={{ transformOrigin: `50% ${percent(geometry.supportLine)}` }}
      >
        <Image
          src="/pequi/dormindo-corpo.webp"
          alt="Pequi, um gato laranja rajado de lenço verde, dormindo esticado com uma pata pendurada"
          fill
          sizes={sizes}
          loading="eager"
          fetchPriority="high"
        />
      </div>

      <div className={styles.zzz} aria-hidden="true">
        <span>Z</span>
        <span>Z</span>
        <span>Z</span>
      </div>

      {pawTarget ? (
        <div
          className={styles.target}
          style={{ left: percent(geometry.paw.tipX), top: percent(geometry.paw.tipY) }}
        >
          {pawTarget}
        </div>
      ) : null}
    </div>
  );
}
