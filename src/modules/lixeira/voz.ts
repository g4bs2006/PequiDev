/**
 * A voz do Pequi na lixeira, pela Web Speech API do navegador (grátis, sem
 * rede). A legenda no balão vale sempre, inclusive no mudo.
 */
const CHAVE_MUDO = "pequidev:lixeira:mudo";

let vozPreferida: SpeechSynthesisVoice | null = null;
// A preferência também fica na memória: com o armazenamento bloqueado (janela
// anônima, Safari restrito), o botão de mudo continua valendo nesta página.
let mudoNaMemoria: boolean | null = null;
let observandoVozes = false;

function sinteseDisponivel(): SpeechSynthesis | null {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    return window.speechSynthesis;
  } catch {
    return null;
  }
}

function escolherVoz(sintese: SpeechSynthesis): SpeechSynthesisVoice | null {
  try {
    const vozes = sintese.getVoices();
    const ptBr = vozes.find((voz) => voz.lang.toLowerCase() === "pt-br");
    const portugues = vozes.find((voz) => voz.lang.toLowerCase().startsWith("pt"));

    vozPreferida = ptBr ?? portugues ?? null;
    return vozPreferida;
  } catch {
    vozPreferida = null;
    return null;
  }
}

function observarVozes(sintese: SpeechSynthesis) {
  if (observandoVozes) return;

  try {
    sintese.addEventListener("voiceschanged", () => {
      escolherVoz(sintese);
    });
    observandoVozes = true;
  } catch {
    // A voz padrão ainda funciona em navegadores sem o evento.
  }
}

/** Lê a preferência de mudo salva para a lixeira. */
export function estaMudo(): boolean {
  if (mudoNaMemoria !== null) return mudoNaMemoria;
  try {
    if (typeof window === "undefined") return false;
    mudoNaMemoria = window.localStorage.getItem(CHAVE_MUDO) === "true";
    return mudoNaMemoria;
  } catch {
    return false;
  }
}

export function definirMudo(mudo: boolean): void {
  mudoNaMemoria = mudo;
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHAVE_MUDO, String(mudo));
  } catch {
    // A preferência vale só nesta página quando o armazenamento é bloqueado.
  }
}

/** Fala o texto, cancelando qualquer fala anterior. */
export function falar(texto: string): void {
  try {
    if (!texto || estaMudo()) return;

    const sintese = sinteseDisponivel();
    if (!sintese || typeof SpeechSynthesisUtterance === "undefined") return;

    observarVozes(sintese);
    const voz = escolherVoz(sintese);
    const fala = new SpeechSynthesisUtterance(texto);

    fala.lang = "pt-BR";
    fala.rate = 1.05;
    fala.pitch = 1.2;
    if (voz) fala.voice = voz;

    sintese.cancel();
    sintese.speak(fala);
  } catch {
    // A legenda continua visível quando a síntese falha.
  }
}

/** Libera a voz a partir do gesto e fala a saudação recebida. */
export function desbloquearVoz(boasVindas: string): void {
  try {
    falar(boasVindas);
  } catch {
    // A câmera não depende do suporte à voz.
  }
}
