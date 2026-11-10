import { DreamTrigger, SleepingPequi } from "@/modules/pequi";
import { ScrollHint } from "./ScrollHint";
import styles from "./Hero.module.css";

/**
 * Faixa de baixo do hero: o nome gigante com o Pequi dormindo na borda de cima.
 * O nome aqui é enfeite (o site já se apresenta no menu e no título da página),
 * por isso fica fora da leitura de tela.
 */
export function TitleBand() {
  return (
    <div data-plataforma className={styles.band}>
      <div className={styles.wordmarkFrame}>
        <p aria-hidden="true" className={`${styles.wordmark} font-display font-bold`}>
          <span>Pequi</span>
          <span>Dev</span>
        </p>
      </div>

      <div className={styles.pequi}>
        <SleepingPequi sizes="(min-width: 768px) 72vw, 104vw" pawTarget={<ScrollHint />} />

        <DreamTrigger
          ariaLabel="Entrar no sonho do Pequi (modo jogo)"
          className="group absolute left-[15%] top-[26%] z-10 h-[30%] w-[70%] cursor-pointer rounded-[40%]"
        >
          <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-2xl bg-surface px-3 py-2 font-meme text-xs text-ink opacity-0 shadow-soft transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-70">
            entrar no sonho do Pequi
          </span>
        </DreamTrigger>
      </div>
    </div>
  );
}
