import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { sleepingPequi } from "@/modules/pequi";
import { heroCopy } from "../content";
import { CodeCard } from "./CodeCard";
import { TitleBand } from "./TitleBand";
import styles from "./Hero.module.css";

/** Primeira tela da home: frase de abertura e código em cima, nome e Pequi embaixo. */
export function Hero() {
  const { title, subtitle, primaryAction, secondaryAction } = heroCopy;

  return (
    <section
      className={styles.hero}
      aria-labelledby="hero-titulo"
      style={
        {
          "--pequi-rise": sleepingPequi.rise,
          "--pequi-body": sleepingPequi.bodyHeight,
        } as CSSProperties
      }
    >
      <div className={styles.top}>
        <div className="mx-auto grid h-full w-full max-w-[84rem] content-center items-center gap-x-12 gap-y-5 px-5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:px-10">
          <div>
            <h1
              id="hero-titulo"
              className={`${styles.headline} font-display font-bold text-balance`}
            >
              {title}
            </h1>
            <p className="mt-3 max-w-[34rem] md:mt-4 text-base text-pretty text-ink-soft md:text-lg">
              {subtitle}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-6">
              <ButtonLink href={primaryAction.href}>{primaryAction.label}</ButtonLink>
              <ButtonLink href={secondaryAction.href} variant="soft">
                {secondaryAction.label}
              </ButtonLink>
            </div>
          </div>

          <CodeCard className={`${styles.code} w-full max-w-[30rem] md:justify-self-end`} />
        </div>
      </div>

      <TitleBand />
    </section>
  );
}
