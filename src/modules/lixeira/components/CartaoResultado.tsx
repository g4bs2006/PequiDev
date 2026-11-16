"use client";

import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TransitionEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  children: ReactNode;
  /** Chamado uma vez, ao soltar além do limite ou pelos botões/teclas. */
  onResposta: (acertou: boolean) => void;
  desabilitado?: boolean;
};

const LIMITE = 96;
const VELOCIDADE_ALTA = 0.6;
const GIRO_MAXIMO = 12;

type Arrasto = {
  inicioX: number;
  ultimoX: number;
  ultimoTempo: number;
  velocidade: number;
};

export function CartaoResultado({ children, onResposta, desabilitado = false }: Props) {
  const arrastoRef = useRef<Arrasto | null>(null);
  const deslocamentoRef = useRef(0);
  const respondeuRef = useRef(false);
  const respostaPendenteRef = useRef<boolean | null>(null);
  const [deslocamento, setDeslocamento] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [saindo, setSaindo] = useState<-1 | 0 | 1>(0);
  const [menosMovimento, setMenosMovimento] = useState(false);
  // Estado (e não só o ref) para os botões se desligarem na renderização.
  const [respondido, setRespondido] = useState(false);
  const reservaRef = useRef<number | null>(null);

  // Rede de segurança: se a transição não terminar (aba em segundo plano,
  // por exemplo), a resposta chega mesmo assim.
  useEffect(() => () => {
    if (reservaRef.current !== null) window.clearTimeout(reservaRef.current);
  }, []);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const atualizar = () => setMenosMovimento(consulta.matches);

    atualizar();
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);

  function moverPara(valor: number) {
    deslocamentoRef.current = valor;
    setDeslocamento(valor);
  }

  function voltar() {
    arrastoRef.current = null;
    setArrastando(false);
    moverPara(0);
  }

  function sair(direcao: -1 | 1) {
    if (desabilitado || respondeuRef.current) return;

    respondeuRef.current = true;
    setRespondido(true);
    respostaPendenteRef.current = direcao > 0;
    reservaRef.current = window.setTimeout(entregarResposta, 600);
    arrastoRef.current = null;
    setArrastando(false);
    moverPara(direcao * LIMITE);
    setSaindo(direcao);
  }

  function aoApertarPonteiro(evento: ReactPointerEvent<HTMLDivElement>) {
    if (desabilitado || respondeuRef.current || !evento.isPrimary) return;
    if (evento.pointerType === "mouse" && evento.button !== 0) return;

    evento.currentTarget.setPointerCapture(evento.pointerId);
    const agora = performance.now();
    arrastoRef.current = {
      inicioX: evento.clientX,
      ultimoX: evento.clientX,
      ultimoTempo: agora,
      velocidade: 0,
    };
    setArrastando(true);
    setSaindo(0);
  }

  function aoMoverPonteiro(evento: ReactPointerEvent<HTMLDivElement>) {
    const arrasto = arrastoRef.current;
    if (!arrasto || desabilitado || respondeuRef.current) return;

    const agora = performance.now();
    const tempo = agora - arrasto.ultimoTempo;

    if (tempo > 0) {
      arrasto.velocidade = (evento.clientX - arrasto.ultimoX) / tempo;
    }

    arrasto.ultimoX = evento.clientX;
    arrasto.ultimoTempo = agora;
    moverPara(evento.clientX - arrasto.inicioX);
  }

  function aoSoltarPonteiro(evento: ReactPointerEvent<HTMLDivElement>) {
    const arrasto = arrastoRef.current;
    if (!arrasto || respondeuRef.current) return;

    if (evento.currentTarget.hasPointerCapture(evento.pointerId)) {
      evento.currentTarget.releasePointerCapture(evento.pointerId);
    }

    const deslocou = deslocamentoRef.current;
    const rapido = Math.abs(arrasto.velocidade) > VELOCIDADE_ALTA;

    if (Math.abs(deslocou) >= LIMITE || rapido) {
      const sentido = rapido && arrasto.velocidade !== 0
        ? Math.sign(arrasto.velocidade)
        : Math.sign(deslocou);
      sair(sentido < 0 ? -1 : 1);
      return;
    }

    voltar();
  }

  function aoCancelarPonteiro(evento: ReactPointerEvent<HTMLDivElement>) {
    if (evento.currentTarget.hasPointerCapture(evento.pointerId)) {
      evento.currentTarget.releasePointerCapture(evento.pointerId);
    }
    voltar();
  }

  function aoTeclado(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;

    evento.preventDefault();
    sair(evento.key === "ArrowRight" ? 1 : -1);
  }

  function terminarSaida(evento: TransitionEvent<HTMLDivElement>) {
    if (evento.target !== evento.currentTarget || saindo === 0) return;
    if (evento.propertyName !== "transform" && evento.propertyName !== "opacity") return;

    entregarResposta();
  }

  function entregarResposta() {
    if (reservaRef.current !== null) {
      window.clearTimeout(reservaRef.current);
      reservaRef.current = null;
    }
    const resposta = respostaPendenteRef.current;
    respostaPendenteRef.current = null;
    if (resposta !== null) onResposta(resposta);
  }

  const giro = menosMovimento
    ? 0
    : Math.max(-GIRO_MAXIMO, Math.min(GIRO_MAXIMO, deslocamento / 20));
  const transformacao = saindo !== 0 && !menosMovimento
    ? `translateX(${saindo * 120}%) rotate(${saindo * GIRO_MAXIMO}deg)`
    : `translateX(${deslocamento}px) rotate(${giro}deg)`;
  const intensidade = Math.min(1, Math.abs(deslocamento) / LIMITE);
  const acertou = deslocamento >= 0;

  return (
    <div>
      <p className="mb-2 text-sm text-ink-soft">Acertei? Arrasta pro lado.</p>
      <div
        tabIndex={0}
        role="group"
        aria-label="Resultado. Arraste para a direita se acertei, para a esquerda se errei."
        aria-disabled={desabilitado}
        onKeyDown={aoTeclado}
        onPointerDown={aoApertarPonteiro}
        onPointerMove={aoMoverPonteiro}
        onPointerUp={aoSoltarPonteiro}
        onPointerCancel={aoCancelarPonteiro}
        onTransitionEnd={terminarSaida}
        className="relative cursor-grab select-none active:cursor-grabbing"
        style={{
          touchAction: "pan-y",
          transform: transformacao,
          opacity: saindo === 0 ? 1 : 0,
          transition: arrastando
            ? "none"
            : "transform var(--dur-base) var(--curva-bote), opacity var(--dur-base) var(--curva-bote)",
        }}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-4 z-10 rounded-full px-4 py-2 font-display font-bold shadow-soft ${
            acertou
              ? "right-4 bg-tag text-on-tag"
              : "left-4 bg-danger text-tinta"
          }`}
          style={{ opacity: intensidade }}
        >
          {acertou ? "Acertou ✓" : "Errou ✗"}
        </span>
        {children}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => sair(-1)}
          disabled={desabilitado || respondido}
          className="aperta min-h-11 cursor-pointer rounded-full bg-danger px-4 py-3 font-display font-bold text-tinta disabled:cursor-not-allowed disabled:opacity-60"
        >
          ✗ Errou
        </button>
        <button
          type="button"
          onClick={() => sair(1)}
          disabled={desabilitado || respondido}
          className="aperta min-h-11 cursor-pointer rounded-full bg-tag px-4 py-3 font-display font-bold text-creme disabled:cursor-not-allowed disabled:opacity-60"
        >
          Acertou ✓
        </button>
      </div>
    </div>
  );
}
