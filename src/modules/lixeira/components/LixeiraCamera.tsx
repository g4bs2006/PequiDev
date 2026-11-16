"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { guardarNoCache, sincronizarExemplos } from "../cache";
import { type Classe, categoriaIds, categorias } from "../categorias";
import {
  desativarMeusExemplos,
  garantirSessao,
  registrarDescarte,
  salvarExemplo,
  type Sessao,
} from "../queries";
import { capturarFoto } from "../visao/foto";
// Só o tipo: o import() abaixo é que traz o TensorFlow, depois do toque.
import type { Visao } from "../visao/modelo";
import type { Veredito } from "../visao/votacao";

type Estado = "inicial" | "carregando" | "pronto" | "erro";

type ErroAbertura = {
  titulo: string;
  texto: string;
  podeTentar: boolean;
};

const contagemInicial: Record<Classe, number> = {
  metal: 0,
  plastico: 0,
  papel: 0,
  vidro: 0,
  rejeito: 0,
  vazio: 0,
};

class FalhaModelo extends Error {}
class TentativaCancelada extends Error {}

function pararCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function explicarErro(erro: unknown): ErroAbertura {
  if (erro instanceof FalhaModelo) {
    return {
      titulo: "Não consegui acordar meu olho",
      texto: "O modelo não baixou. Confere a internet e tenta de novo, sô.",
      podeTentar: true,
    };
  }

  const nome = erro instanceof Error ? erro.name : "";

  if (nome === "NotAllowedError") {
    return {
      titulo: "A câmera foi bloqueada",
      texto: "Libera a câmera nas permissões do navegador e tenta de novo.",
      podeTentar: true,
    };
  }

  if (nome === "NotFoundError") {
    return {
      titulo: "Não achei uma câmera",
      texto: "Este aparelho não mostrou nenhuma câmera para o Pequi.",
      podeTentar: false,
    };
  }

  return {
    titulo: "A câmera tropeçou",
    texto: "Não consegui abrir a imagem. Fecha outro app que usa a câmera e tenta de novo.",
    podeTentar: true,
  };
}

export function LixeiraCamera({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const visaoRef = useRef<Visao | null>(null);
  const sessaoRef = useRef<Sessao | null>(null);
  const filaRef = useRef<Promise<void>>(Promise.resolve());
  const montadoRef = useRef(true);
  const tentativaRef = useRef(0);

  const [estado, setEstado] = useState<Estado>("inicial");
  const [erro, setErro] = useState<ErroAbertura | null>(null);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [contagens, setContagens] = useState<Record<Classe, number>>(contagemInicial);
  const [resultado, setResultado] = useState<Veredito | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [esquecendo, setEsquecendo] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const liberarAtuais = useCallback(() => {
    pararCamera(streamRef.current);
    streamRef.current = null;

    visaoRef.current?.descartar();
    visaoRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const definirVideo = useCallback((elemento: HTMLVideoElement | null) => {
    videoRef.current = elemento;

    if (elemento && streamRef.current) {
      elemento.srcObject = streamRef.current;
      void elemento.play().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    montadoRef.current = true;

    return () => {
      montadoRef.current = false;
      tentativaRef.current += 1;
      liberarAtuais();
    };
  }, [liberarAtuais]);

  async function abrirCamera() {
    liberarAtuais();
    sessaoRef.current = null;
    setSessao(null);
    setResultado(null);
    setErro(null);
    setMensagem("");
    setContagens(contagemInicial);

    if (!window.isSecureContext) {
      setErro({
        titulo: "A câmera precisa de HTTPS",
        texto: "Abra esta página por uma conexão segura para usar a câmera.",
        podeTentar: false,
      });
      setEstado("erro");
      return;
    }

    const dispositivos = navigator.mediaDevices;
    if (!dispositivos?.getUserMedia) {
      setErro({
        titulo: "O navegador não liberou a câmera",
        texto: "Tenta abrir a página em um navegador atualizado do celular.",
        podeTentar: false,
      });
      setEstado("erro");
      return;
    }

    const tentativa = tentativaRef.current + 1;
    tentativaRef.current = tentativa;
    setEstado("carregando");

    // Num objeto, e não em variáveis soltas: o TypeScript não enxerga a
    // atribuição dentro dos .then() e trataria as duas como sempre nulas.
    const criados: { camera: MediaStream | null; visao: Visao | null } = {
      camera: null,
      visao: null,
    };

    const cameraPromise = dispositivos
      .getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      .then((stream) => {
        criados.camera = stream;

        if (!montadoRef.current || tentativaRef.current !== tentativa) {
          pararCamera(stream);
          throw new TentativaCancelada();
        }

        return stream;
      });

    const modeloPromise = import("../visao/modelo")
      .then(({ criarVisao }) => criarVisao())
      .catch(() => {
        throw new FalhaModelo();
      })
      .then((visao) => {
        criados.visao = visao;

        if (!montadoRef.current || tentativaRef.current !== tentativa) {
          visao.descartar();
          throw new TentativaCancelada();
        }

        return visao;
      });

    const exemplosPromise = garantirSessao()
      .then(async (novaSessao) => ({
        sessao: novaSessao,
        exemplos: await sincronizarExemplos(novaSessao),
      }))
      .catch(() => null);

    try {
      const [stream, visao, persistencia] = await Promise.all([
        cameraPromise,
        modeloPromise,
        exemplosPromise,
      ]);

      if (!montadoRef.current || tentativaRef.current !== tentativa) {
        pararCamera(stream);
        visao.descartar();
        return;
      }

      streamRef.current = stream;
      visaoRef.current = visao;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => undefined);
      }

      let dadosAtivos = persistencia;

      if (dadosAtivos) {
        try {
          visao.carregar(dadosAtivos.exemplos);
        } catch {
          visao.esquecer();
          dadosAtivos = null;
        }
      }

      const sessaoAtiva = dadosAtivos?.sessao ?? null;
      sessaoRef.current = sessaoAtiva;
      setSessao(sessaoAtiva);
      setContagens(visao.contagem());

      const total = dadosAtivos?.exemplos.length ?? 0;
      if (total > 0) setMensagem(`Lembrei de ${total} exemplos.`);

      setEstado("pronto");
    } catch (falha) {
      pararCamera(criados.camera);
      criados.visao?.descartar();

      if (
        !montadoRef.current ||
        tentativaRef.current !== tentativa ||
        falha instanceof TentativaCancelada
      ) {
        return;
      }

      // Invalida o recurso que ainda possa terminar depois deste erro.
      tentativaRef.current += 1;
      setErro(explicarErro(falha));
      setEstado("erro");
    }
  }

  function ensinar(classe: Classe) {
    const visao = visaoRef.current;
    const video = videoRef.current;
    if (!visao || !video || analisando || esquecendo) return;

    const antes = visao.contagem()[classe];
    const embedding = visao.ensinar(video, classe);
    const novasContagens = visao.contagem();
    setContagens(novasContagens);

    if (novasContagens[classe] > antes && embedding) {
      const nome = classe === "vazio" ? "Vazio" : categorias[classe].nome;
      setMensagem(`Guardei mais um exemplo de ${nome}.`);

      const sessaoAtual = sessaoRef.current;
      if (sessaoAtual) {
        let fotoPromise: Promise<Blob>;

        try {
          fotoPromise = capturarFoto(video);
        } catch {
          fotoPromise = Promise.reject(new Error("Não consegui tirar a foto."));
        }

        filaRef.current = filaRef.current
          .catch(() => undefined)
          .then(async () => {
            const foto = await fotoPromise;
            const exemplo = await salvarExemplo(sessaoAtual, classe, embedding, foto);
            await guardarNoCache(sessaoAtual, exemplo);
          })
          .catch(() => {
            if (
              montadoRef.current &&
              sessaoRef.current?.userId === sessaoAtual.userId
            ) {
              setMensagem(
                "Não consegui guardar esse exemplo, mas lembro dele até cê fechar a página.",
              );
            }
          });
      }
    } else {
      setMensagem("Ainda não enxerguei um quadro da câmera. Espera só um tiquinho.");
    }
  }

  async function analisarObjeto() {
    const visao = visaoRef.current;
    const video = videoRef.current;
    if (!visao || !video || analisando || esquecendo) return;

    setAnalisando(true);
    setResultado(null);
    setMensagem("Olhando cinco quadros…");

    try {
      const veredito = await visao.analisar(video);
      if (!montadoRef.current || visaoRef.current !== visao) return;

      setResultado(veredito);
      setMensagem(
        veredito ? "" : "Não consegui ver o objeto. Chega mais perto e tenta de novo.",
      );

      if (veredito && sessaoRef.current) {
        void registrarDescarte(veredito).catch(() => undefined);
      }
    } catch {
      if (montadoRef.current) {
        setMensagem("Meu olho tropeçou na análise. Tenta mais uma vez, sô.");
      }
    } finally {
      if (montadoRef.current) setAnalisando(false);
    }
  }

  async function esquecer() {
    const visao = visaoRef.current;
    const sessaoAtual = sessaoRef.current;
    if (!visao || analisando || esquecendo || sessaoAtual?.admin) return;

    setResultado(null);

    if (!sessaoAtual) {
      visao.esquecer();
      setContagens({ ...contagemInicial });
      setMensagem("Pronto, esqueci o que cê me ensinou.");
      return;
    }

    setEsquecendo(true);
    setMensagem("Esquecendo o que cê me ensinou…");

    try {
      await filaRef.current.catch(() => undefined);
      await desativarMeusExemplos(sessaoAtual);
      const exemplos = await sincronizarExemplos(sessaoAtual);

      if (
        !montadoRef.current ||
        visaoRef.current !== visao ||
        sessaoRef.current?.userId !== sessaoAtual.userId
      ) {
        return;
      }

      visao.carregar(exemplos);
      setContagens(visao.contagem());
      setMensagem("Pronto, esqueci o que cê me ensinou.");
    } catch {
      if (montadoRef.current) {
        setMensagem("Não consegui esquecer agora. Tenta de novo daqui a pouco.");
      }
    } finally {
      if (montadoRef.current) setEsquecendo(false);
    }
  }

  const classesEnsinadas = Object.values(contagens).filter((quantidade) => quantidade > 0).length;
  const podeAnalisar = classesEnsinadas >= 2 && !analisando && !esquecendo;
  const cameraVisivel = estado === "carregando" || estado === "pronto";

  return (
    <div className={`rounded-card bg-surface p-5 shadow-soft sm:p-6 ${className ?? ""}`}>
      {estado === "inicial" && (
        <div>
          <h2 className="font-display text-2xl font-bold">Bora treinar meu olho?</h2>
          <p className="mt-2 text-ink-soft">
            A câmera e o modelo só acordam depois do seu toque.
          </p>
          <button
            type="button"
            onClick={abrirCamera}
            className="aperta mt-5 min-h-11 cursor-pointer rounded-full bg-accent px-6 py-3 font-display font-bold text-on-accent shadow-button"
          >
            Abrir a câmera
          </button>
        </div>
      )}

      {estado === "erro" && erro && (
        <div role="alert">
          <h2 className="font-display text-2xl font-bold">{erro.titulo}</h2>
          <p className="mt-2 text-ink-soft">{erro.texto}</p>
          {erro.podeTentar && (
            <button
              type="button"
              onClick={abrirCamera}
              className="aperta mt-5 min-h-11 cursor-pointer rounded-full bg-accent px-6 py-3 font-display font-bold text-on-accent shadow-button"
            >
              Tentar de novo
            </button>
          )}
        </div>
      )}

      {cameraVisivel && (
        <>
          {estado === "carregando" && (
            <p aria-live="polite" className="mb-4 font-display font-bold text-ink-soft">
              Acordando o olho do Pequi…
            </p>
          )}

          <div className="relative w-full overflow-hidden rounded-card bg-page">
            <video
              ref={definirVideo}
              playsInline
              muted
              autoPlay
              aria-label="Imagem ao vivo da câmera traseira"
              className="aspect-[3/4] w-full rounded-card object-cover md:aspect-[4/3]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-3/5 -translate-x-1/2 -translate-y-1/2 rounded-card border-2 border-dashed border-creme"
            />
            <p className="pointer-events-none absolute right-4 bottom-4 left-4 rounded-full bg-tinta/70 px-4 py-2 text-center text-sm font-bold text-creme">
              Um objeto por vez, dentro do quadrado
            </p>
          </div>
        </>
      )}

      {estado === "pronto" && (
        <div className="mt-6">
          <h2 className="font-display text-2xl font-bold">Primeiro, me ensina</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categoriaIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => ensinar(id)}
                disabled={analisando || esquecendo}
                aria-label={`Ensinar ${categorias[id].nome} com o quadro atual`}
                className="aperta min-h-11 cursor-pointer rounded-full px-4 py-3 font-display font-bold disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: categorias[id].fundo,
                  color: categorias[id].texto,
                }}
              >
                {categorias[id].nome} · {contagens[id]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => ensinar("vazio")}
              disabled={analisando || esquecendo}
              aria-label="Ensinar Vazio com o quadro atual"
              className="aperta min-h-11 cursor-pointer rounded-full border-2 border-ink-soft bg-page px-4 py-3 font-display font-bold text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              Vazio · {contagens.vazio}
            </button>
          </div>

          <p className="mt-3 text-sm text-ink-soft">
            Ensine uns 10 de cada, mudando o objeto e o ângulo. Para Vazio, aponte para o fundo sem
            nada.
          </p>

          <div className="mt-6 border-t border-ink-soft pt-6">
            <button
              type="button"
              onClick={analisarObjeto}
              disabled={!podeAnalisar}
              aria-describedby={classesEnsinadas < 2 ? "lixeira-analisar-dica" : undefined}
              className="aperta min-h-11 w-full cursor-pointer rounded-full bg-accent px-6 py-3 font-display text-lg font-bold text-on-accent shadow-button disabled:cursor-not-allowed disabled:opacity-60"
            >
              {analisando ? "Olhando cinco quadros…" : "Analisar objeto"}
            </button>

            {classesEnsinadas < 2 && (
              <p id="lixeira-analisar-dica" className="mt-2 text-sm text-ink-soft">
                Ensine pelo menos duas classes antes de analisar.
              </p>
            )}
          </div>

          <div aria-live="polite" aria-atomic="true" className="mt-5">
            {resultado && <Resultado resultado={resultado} />}
          </div>

          <p aria-live="polite" className="mt-3 min-h-6 text-sm text-ink-soft">
            {mensagem}
          </p>

          {sessao?.admin ? (
            <p className="mt-4 text-sm text-ink-soft">
              Cê é admin: o que ensinar aqui vira a base que todo mundo usa.
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={esquecer}
                disabled={esquecendo}
                className="aperta tinge mt-4 min-h-11 cursor-pointer px-1 text-sm font-bold text-ink-soft underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {esquecendo ? "Esquecendo…" : "Esquecer o que aprendi"}
              </button>
              <p className="mt-3 text-sm text-ink-soft">
                {sessao
                  ? "O que cê me ensina fica guardado e só vale pra você."
                  : "Hoje não consigo guardar o que cê me ensina. Vale só enquanto a página estiver aberta."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Resultado({ resultado }: { resultado: Veredito }) {
  if (!resultado.aceito) {
    return (
      <div className="rounded-card bg-page p-5 text-ink">
        <p className="font-display text-xl font-bold">
          Fiquei na dúvida. Tenta de novo, mais perto.
        </p>
      </div>
    );
  }

  if (resultado.classe === "vazio") {
    return (
      <div className="rounded-card bg-page p-5 text-ink">
        <p className="font-display text-xl font-bold">Não vi nada na frente da câmera.</p>
      </div>
    );
  }

  const categoria = categorias[resultado.classe];
  const porcentagem = Math.round(resultado.confianca * 100);

  return (
    <div
      className="rounded-card p-5"
      style={{ backgroundColor: categoria.fundo, color: categoria.texto }}
    >
      <p className="font-display text-2xl font-bold">
        {categoria.cor} · {categoria.nome}
      </p>
      <p className="mt-1 font-bold">
        Lixeira {categoria.lixeira} · {porcentagem}% de certeza ({resultado.votos} de {resultado.total}{" "}
        quadros)
      </p>
    </div>
  );
}
