import type { CSSProperties, ReactNode } from "react";

import geometry from "../data/dormindo.json";
import styles from "./PequiNap.module.css";
import { SleepingPequi } from "./SleepingPequi";

/** Medidas em frações da largura do Pequi (as mesmas do hero). */
const rise = (geometry.supportLine * geometry.height) / geometry.width;
const body = ((geometry.supportLine - geometry.top) * geometry.height) / geometry.width;

/**
 * Um aviso com o Pequi dormindo deitado em cima dele, de pata pendurada, como
 * no hero. Para lugares vazios, como a lista de posts antes do primeiro: o
 * texto fica abaixo da pata, nunca por baixo dela.
 */
export function PequiNap({ children }: { children: ReactNode }) {
  return (
    <div className={styles.nap} style={{ "--rise": rise, "--body": body } as CSSProperties}>
      <div className={styles.cat}>
        <SleepingPequi sizes="(min-width: 768px) 20rem, 72vw" />
      </div>
      <div className={styles.box}>{children}</div>
    </div>
  );
}
