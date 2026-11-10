import { SleepingPequi } from "@/modules/pequi";
import { ScrollHint } from "./ScrollHint";
import styles from "./Hero.module.css";

/**
 * Faixa de baixo do hero: o nome gigante com o Pequi dormindo na borda de cima.
 * O nome aqui é enfeite (o site já se apresenta no menu e no título da página),
 * por isso fica fora da leitura de tela.
 */
export function TitleBand() {
  return (
    <div className={styles.band}>
      <div className={styles.wordmarkFrame}>
        <p aria-hidden="true" className={`${styles.wordmark} font-display font-bold`}>
          <span>Pequi</span>
          <span>Dev</span>
        </p>
      </div>

      <div className={styles.pequi}>
        <SleepingPequi sizes="(min-width: 768px) 72vw, 104vw" pawTarget={<ScrollHint />} />
      </div>
    </div>
  );
}
