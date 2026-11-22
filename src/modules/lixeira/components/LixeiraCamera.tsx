"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { exemplosDoAparelho, guardarNoCache, sincronizarExemplos } from "../cache";
import { guardarParaOffline } from "../offline";
import { type Classe, categoriaIds, categorias } from "../categorias";
import { sortearFala } from "../falas";
import {
  desativarExemplo,
  desativarMeusExemplos,
  FalhaNuvem,
  garantirSessao,
  guardarFotoDoDescarte,
  novoCaminhoDeFoto,
  perguntarAoPequi,
  registrarDescarte,
  responderDescarte,
  salvarExemplo,
  type Humor,
  type RespostaPequi,
  type ExemploSalvo,
  type Sessao,
} from "../queries";
import { definirMudo, desbloquearVoz, estaMudo, falar } from "../voz";
import { capturarFoto } from "../visao/foto";
// Só o tipo: o import() abaixo é que traz o TensorFlow, depois do toque.
import type { Visao } from "../visao/modelo";
import type { Veredito } from "../visao/votacao";
import { CartaoResultado } from "./CartaoResultado";
import { EscolherClasse } from "./EscolherClasse";
import { type EstadoPequi, PequiFiscal } from "./PequiFiscal";
import { PequiDeChapeu } from "@/modules/pequi";

/**
 * Confiança do KNN a partir da qual o Pequi responde sem perguntar à nuvem.
 * Era 0,85; a avaliação de 2026-11-22 (docs/lixeira-avaliacao.md) mostrou que
 * 0,7 resolve 3 vezes mais no celular com 91% de acerto.
 */
const CORTE_LOCAL = 0.7;

type Estado = "inicial" | "carregando" | "pronto" | "erro";

type ErroAbertura = {
  titulo: string;
  texto: string;
  podeTentar: boolean;
};

type DadosResultado = {
  embedding: Float32Array | null;
  foto: Blob | null;
  descarteId: string | null;
};

type ResultadoMostrado =
  | ({ tipo: "local"; veredito: Veredito } & DadosResultado)
  | ({ tipo: "nuvem"; resposta: RespostaPequi } & DadosResultado)
  | ({ tipo: "plano-b"; veredito: Veredito; frase: string } & DadosResultado);

type FluxoResposta = "cartao" | "escolher" | "acertou" | "corrigido";

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

async function capturarMomento(visao: Visao, video: HTMLVideoElement) {
  const embedding = visao.embeddingDe(video);

  try {
    return { embedding, foto: await capturarFoto(video) };
  } catch {
    return { embedding, foto: null };
  }
}

function classeDoResultado(resultado: ResultadoMostrado): Classe {
  return resultado.tipo === "nuvem" ? resultado.resposta.classe : resultado.veredito.classe;
}

function textoDaCorrecao(classe: Classe) {
  if (classe === "vazio") return "Aprendi: não tinha nada.";
  const categoria = categorias[classe];
  return `Aprendi: isso é ${categoria.nome} (${categoria.cor}).`;
}

function estadoDoVeredito(veredito: Veredito): EstadoPequi {
  if (!veredito.aceito) return "pensativo";
  if (veredito.classe === "vazio") return "surpreso";
  if (veredito.classe === "rejeito") return "decepcionado";
  return "feliz";
}

function estadoDoHumor(humor: Humor): EstadoPequi {
  return humor;
}

function corDaClasse(classe: Classe): string | null {
  return classe === "vazio" ? null : categorias[classe].fundo;
}

export function LixeiraCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const visaoRef = useRef<Visao | null>(null);
  const sessaoRef = useRef<Sessao | null>(null);
  const filaRef = useRef<Promise<void>>(Promise.resolve());
  const montadoRef = useRef(true);
  const tentativaRef = useRef(0);
  const respostaEmCursoRef = useRef(false);
  const sonoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dormindoRef = useRef(false);

  const [estado, setEstado] = useState<Estado>("inicial");
  const [erro, setErro] = useState<ErroAbertura | null>(null);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [contagens, setContagens] = useState<Record<Classe, number>>(contagemInicial);
  const [resultado, setResultado] = useState<ResultadoMostrado | null>(null);
  const [ensinoAberto, setEnsinoAberto] = useState(false);
  const [fluxoResposta, setFluxoResposta] = useState<FluxoResposta>("cartao");
  const [textoResposta, setTextoResposta] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [pensando, setPensando] = useState(false);
  const [esquecendo, setEsquecendo] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [estadoPequi, setEstadoPequi] = useState<EstadoPequi>("neutro");
  const [falaPequi, setFalaPequi] = useState<string | null>(null);
  const [corBrilho, setCorBrilho] = useState<string | null>(null);
  const [vezPequi, setVezPequi] = useState(0);
  // O palco (com o botão de voz) só aparece depois de abrir a câmera, então ler
  // a preferência já na criação do estado não muda o HTML do servidor.
  const [mudo, setMudo] = useState(estaMudo);

  const reagir = useCallback((
    novoEstado: EstadoPequi,
    fala: string | null,
    opcoes?: { falar?: boolean; cor?: string | null },
  ) => {
    dormindoRef.current = false;
    setEstadoPequi(novoEstado);
    setFalaPequi(fala);
    setCorBrilho(opcoes?.cor ?? null);
    setVezPequi((vez) => vez + 1);

    if (fala && opcoes?.falar !== false) falar(fala);
  }, []);

  const reiniciarSono = useCallback(() => {
    if (sonoRef.current) clearTimeout(sonoRef.current);

    if (dormindoRef.current) {
      dormindoRef.current = false;
      setEstadoPequi("neutro");
      setFalaPequi(null);
      setCorBrilho(null);
      setVezPequi((vez) => vez + 1);
    }

    sonoRef.current = setTimeout(() => {
      dormindoRef.current = true;
      setEstadoPequi("dormindo");
      setFalaPequi(null);
      setCorBrilho(null);
      setVezPequi((vez) => vez + 1);
    }, 60_000);
  }, []);

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
    reiniciarSono();
    return () => {
      if (sonoRef.current) clearTimeout(sonoRef.current);
    };
  }, [reiniciarSono]);

  useEffect(() => {
    montadoRef.current = true;

    return () => {
      montadoRef.current = false;
      tentativaRef.current += 1;
      liberarAtuais();
    };
  }, [liberarAtuais]);

  async function abrirCamera() {
    const oi = sortearFala("boasVindas");
    desbloquearVoz(oi);
    reagir("neutro", oi, { falar: false });

    liberarAtuais();
    sessaoRef.current = null;
    respostaEmCursoRef.current = false;
    setSessao(null);
    setResultado(null);
    setFluxoResposta("cartao");
    setTextoResposta("");
    setPensando(false);
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
      .then(async (novaSessao): Promise<{ sessao: Sessao | null; exemplos: ExemploSalvo[] }> => ({
        sessao: novaSessao,
        exemplos: await sincronizarExemplos(novaSessao),
      }))
      // Sem sessão (sem internet, por exemplo): segue só na memória, mas com o
      // que o aparelho já tinha aprendido.
      .catch(async () => ({ sessao: null, exemplos: await exemplosDoAparelho() }));

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

      let dadosAtivos: typeof persistencia | null = persistencia;

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
      guardarParaOffline();
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

  async function registrarOuNull(
    dados: Parameters<typeof registrarDescarte>[0],
  ): Promise<string | null> {
    try {
      return await registrarDescarte(dados);
    } catch {
      return null;
    }
  }

  async function analisarObjeto() {
    const visao = visaoRef.current;
    const video = videoRef.current;
    if (!visao || !video || analisando || esquecendo) return;

    respostaEmCursoRef.current = false;
    setFluxoResposta("cartao");
    setTextoResposta("");
    setAnalisando(true);
    setPensando(false);
    setResultado(null);
    setMensagem("Olhando cinco quadros…");
    reagir("pensativo", null, { falar: false });

    try {
      let local: Veredito | null = null;

      if (classesEnsinadas >= 2) {
        local = await visao.analisar(video);
        if (!montadoRef.current || visaoRef.current !== visao) return;
      }

      const sessaoAtual = sessaoRef.current;

      if (local?.aceito && local.confianca >= CORTE_LOCAL) {
        const momento = await capturarMomento(visao, video);
        if (!montadoRef.current || visaoRef.current !== visao) return;

        const descarteId = sessaoAtual
          ? await registrarOuNull({
              classeLocal: local.classe,
              confiancaLocal: local.confianca,
              classeFinal: local.classe,
              fonte: "local",
              status: "ok",
            })
          : null;

        if (!montadoRef.current || visaoRef.current !== visao) return;
        const fala = sortearFala(local.classe);
        reagir(estadoDoVeredito(local), fala, {
          cor: estadoDoVeredito(local) === "feliz" ? corDaClasse(local.classe) : null,
        });
        setResultado({ tipo: "local", veredito: local, ...momento, descarteId });
        setMensagem("");
        return;
      }

      if (!sessaoAtual) {
        if (local) {
          const momento = await capturarMomento(visao, video);
          if (!montadoRef.current || visaoRef.current !== visao) return;
          const fala = local.aceito ? sortearFala(local.classe) : sortearFala("duvida");
          reagir(estadoDoVeredito(local), fala, {
            cor: estadoDoVeredito(local) === "feliz" ? corDaClasse(local.classe) : null,
          });
          setResultado({ tipo: "local", veredito: local, ...momento, descarteId: null });
          setMensagem("");
        } else {
          const texto = "Não consegui ver o objeto. Chega mais perto e tenta de novo.";
          setMensagem(texto);
          reagir("pensativo", texto, { falar: false });
        }
        return;
      }

      const embedding = visao.embeddingDe(video);
      const foto = await capturarFoto(video);
      if (
        !montadoRef.current ||
        visaoRef.current !== visao ||
        sessaoRef.current?.userId !== sessaoAtual.userId
      ) {
        return;
      }

      setPensando(true);
      setMensagem("");
      const fotoPath = novoCaminhoDeFoto(sessaoAtual);
      const fotoPathPromise = guardarFotoDoDescarte(sessaoAtual, foto, fotoPath);

      try {
        const resposta = await perguntarAoPequi(foto, { embedding, fotoPath });
        if (
          !montadoRef.current ||
          visaoRef.current !== visao ||
          sessaoRef.current?.userId !== sessaoAtual.userId
        ) {
          return;
        }

        reagir(estadoDoHumor(resposta.humor), resposta.frase, {
          cor: resposta.humor === "feliz" ? corDaClasse(resposta.classe) : null,
        });

        if (resposta.aprendeu && embedding) {
          visao.adicionar(resposta.classe, embedding);
          setContagens(visao.contagem());
          setMensagem("Aprendi esse com a nuvem.");
        }

        const caminhoGuardado = await fotoPathPromise;
        const descarteId = await registrarOuNull({
          classeLocal: local?.classe ?? null,
          confiancaLocal: local?.confianca ?? null,
          classeFinal: resposta.classe,
          fonte: "gpt",
          certezaGpt: resposta.certeza,
          frase: resposta.frase,
          humor: resposta.humor,
          status: "ok",
          fotoPath: caminhoGuardado,
        });

        if (
          !montadoRef.current ||
          visaoRef.current !== visao ||
          sessaoRef.current?.userId !== sessaoAtual.userId
        ) {
          return;
        }

        setPensando(false);
        setResultado({ tipo: "nuvem", resposta, embedding, foto, descarteId });
      } catch (falha) {
        if (
          !montadoRef.current ||
          visaoRef.current !== visao ||
          sessaoRef.current?.userId !== sessaoAtual.userId
        ) {
          return;
        }

        setPensando(false);

        if (!(falha instanceof FalhaNuvem)) throw falha;

        if (!local) {
          const texto = "Não consegui pensar agora. Me ensina uns exemplos ou tenta daqui a pouco.";
          setMensagem(texto);
          reagir("pensativo", texto, { falar: false });
          return;
        }

        const frase = falha.motivo === "limite"
          ? "Já pensei demais por hoje, sô. Vou no chute!"
          : "Hmm, tô sem sinal… vou no chute!";
        const caminhoGuardado = await fotoPathPromise;
        const descarteId = await registrarOuNull({
          classeLocal: local.classe,
          confiancaLocal: local.confianca,
          classeFinal: local.classe,
          fonte: "local",
          frase,
          status: "pendente",
          fotoPath: caminhoGuardado,
        });

        if (
          !montadoRef.current ||
          visaoRef.current !== visao ||
          sessaoRef.current?.userId !== sessaoAtual.userId
        ) {
          return;
        }

        reagir("pensativo", frase);
        setResultado({ tipo: "plano-b", veredito: local, frase, embedding, foto, descarteId });
        setMensagem("");
      }
    } catch {
      if (montadoRef.current) {
        const texto = "Meu olho tropeçou na análise. Tenta mais uma vez, sô.";
        setMensagem(texto);
        reagir("pensativo", texto, { falar: false });
      }
    } finally {
      if (montadoRef.current) {
        setAnalisando(false);
        setPensando(false);
      }
    }
  }

  function aprenderComResultado(
    resultadoAtual: ResultadoMostrado,
    classe: Classe,
    exemploParaDesativar: string | null = null,
  ) {
    const visaoAtual = visaoRef.current;
    const sessaoAtual = sessaoRef.current;
    const embedding = resultadoAtual.embedding;
    const foto = resultadoAtual.foto;

    if (visaoAtual && embedding) {
      visaoAtual.adicionar(classe, embedding);
      setContagens(visaoAtual.contagem());
    }

    if (!sessaoAtual) {
      if (!embedding) setMensagem("Não consegui guardar esse quadro, sô.");
      return;
    }

    filaRef.current = filaRef.current
      .catch(() => undefined)
      .then(async () => {
        let desativou = false;
        let salvou = false;
        let falhou = false;

        if (exemploParaDesativar) {
          try {
            await desativarExemplo(exemploParaDesativar);
            desativou = true;
          } catch {
            falhou = true;
          }
        }

        if (embedding && foto) {
          try {
            const exemplo = await salvarExemplo(sessaoAtual, classe, embedding, foto);
            await guardarNoCache(sessaoAtual, exemplo);
            salvou = true;
          } catch {
            falhou = true;
          }
        } else {
          falhou = true;
        }

        if (desativou) {
          try {
            const exemplos = await sincronizarExemplos(sessaoAtual);

            if (
              montadoRef.current &&
              visaoRef.current === visaoAtual &&
              sessaoRef.current?.userId === sessaoAtual.userId &&
              visaoAtual
            ) {
              visaoAtual.carregar(exemplos);
              // Sem foto salva, a correção ainda vale nesta página.
              if (!salvou && embedding) visaoAtual.adicionar(classe, embedding);
              setContagens(visaoAtual.contagem());
            }
          } catch {
            falhou = true;
          }
        }

        if (falhou) throw new Error("Aprendizado incompleto.");
      })
      .catch(() => {
        if (
          montadoRef.current &&
          sessaoRef.current?.userId === sessaoAtual.userId
        ) {
          setMensagem("Não consegui guardar tudo agora, mas lembro nesta página.");
        }
      });
  }

  function responderNoBanco(
    descarteId: string | null,
    resposta: Parameters<typeof responderDescarte>[1],
  ) {
    if (!descarteId) return;

    void responderDescarte(descarteId, resposta).catch(() => {
      if (montadoRef.current) setMensagem("Não consegui anotar sua resposta agora.");
    });
  }

  function responderCartao(acertou: boolean) {
    if (!resultado || respostaEmCursoRef.current) return;

    respostaEmCursoRef.current = true;

    if (!acertou) {
      setFluxoResposta("escolher");
      return;
    }

    const classe = classeDoResultado(resultado);
    const deveAprender = resultado.tipo === "plano-b"
      || (resultado.tipo === "nuvem" && !resultado.resposta.aprendeu)
      || (resultado.tipo === "local" && resultado.veredito.confianca < CORTE_LOCAL);

    if (deveAprender) aprenderComResultado(resultado, classe);
    responderNoBanco(resultado.descarteId, { confirmado: true });
    reagir("feliz", sortearFala("acertou"), { cor: corDaClasse(classe) });
    setFluxoResposta("acertou");
  }

  function corrigirResultado(classe: Classe) {
    if (!resultado || fluxoResposta !== "escolher") return;

    const exemploParaDesativar = resultado.tipo === "nuvem" && resultado.resposta.aprendeu
      ? resultado.resposta.exemploId
      : null;

    aprenderComResultado(resultado, classe, exemploParaDesativar);
    responderNoBanco(resultado.descarteId, {
      confirmado: false,
      classeFinal: classe,
      status: "revisar",
    });
    setTextoResposta(textoDaCorrecao(classe));
    reagir("aprendendo", sortearFala("corrigido"));
    setFluxoResposta("corrigido");
  }

  function cancelarCorrecao() {
    respostaEmCursoRef.current = false;
    setFluxoResposta("cartao");
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

  function alternarMudo() {
    const novoMudo = !mudo;
    setMudo(novoMudo);
    definirMudo(novoMudo);

    if (novoMudo) {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // A legenda continua disponível sem a síntese.
      }
    }
  }

  const classesEnsinadas = Object.values(contagens).filter((quantidade) => quantidade > 0).length;
  const podeAnalisar = (sessao !== null || classesEnsinadas >= 2) && !analisando && !esquecendo;
  const cameraVisivel = estado === "carregando" || estado === "pronto";
  const gavetaDoResultado = pensando || resultado !== null;

  // Tela inicial e erro: Pequi, uma frase e o botão grande na zona do polegar.
  if (!cameraVisivel) {
    return (
      <div onClickCapture={reiniciarSono} className="flex min-h-dvh flex-col px-5 pt-4 pb-6">
        <BarraDoTopo />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <PequiDeChapeu animacao="parado" escala={3} />
          {estado === "erro" && erro ? (
            <div role="alert">
              <h1 className="font-display text-2xl font-bold">{erro.titulo}</h1>
              <p className="mt-2 text-ink-soft">{erro.texto}</p>
            </div>
          ) : (
            <div>
              <h1 className="font-display text-3xl font-bold">Lixeira do Pequi</h1>
              <p className="mt-2 text-pretty text-ink-soft">
                Aponta a câmera para um lixo e eu falo em qual lixeira ele vai.
              </p>
            </div>
          )}
          <ul className="flex flex-wrap justify-center gap-2" aria-label="As lixeiras">
            {categoriaIds.map((id) => (
              <li
                key={id}
                className="rounded-full px-3 py-1 text-sm font-bold"
                style={{ backgroundColor: categorias[id].fundo, color: categorias[id].texto }}
              >
                {categorias[id].nome} · {categorias[id].cor}
              </li>
            ))}
          </ul>
        </div>
        {estado === "inicial" || erro?.podeTentar ? (
          <button
            type="button"
            onClick={abrirCamera}
            className="aperta min-h-14 w-full cursor-pointer rounded-full bg-accent px-6 font-display text-lg font-bold text-on-accent shadow-button"
          >
            {estado === "erro" ? "Tentar de novo" : "Abrir a câmera"}
          </button>
        ) : null}
        <p className="mt-3 text-center text-xs text-ink-soft">
          A câmera só liga depois do seu toque. Cada cidade tem suas regras de coleta.
        </p>
      </div>
    );
  }

  // Câmera em tela cheia; tudo o que se toca fica embaixo, ao alcance do polegar.
  return (
    <div
      onClickCapture={reiniciarSono}
      className="fixed inset-0 mx-auto max-w-md overflow-hidden bg-tinta text-ink"
    >
      <video
        ref={definirVideo}
        playsInline
        muted
        autoPlay
        aria-label="Imagem ao vivo da câmera traseira"
        className="absolute inset-0 size-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[28%] left-1/2 aspect-square w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-card border-2 border-dashed border-creme"
      >
        <p className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-tinta/60 px-3 py-1 text-xs font-bold whitespace-nowrap text-creme">
          Um objeto por vez, aqui dentro
        </p>
      </div>

      <div className="absolute inset-x-0 top-0 px-4 pt-3">
        <BarraDoTopo>
          <button
            type="button"
            aria-label="Voz do Pequi"
            aria-pressed={!mudo}
            onClick={alternarMudo}
            className={botaoRedondo}
          >
            <span aria-hidden="true">{mudo ? "🔇" : "🔊"}</span>
          </button>
          {sessao ? (
            <Link href="/lixeira/historico" aria-label="Meu histórico" className={botaoRedondo}>
              <span aria-hidden="true">🕘</span>
            </Link>
          ) : null}
        </BarraDoTopo>
        <p aria-live="polite" className="mt-2 text-center">
          {estado === "carregando" ? (
            <span className={pilula}>Acordando o olho do Pequi…</span>
          ) : mensagem ? (
            <span className={pilula}>{mensagem}</span>
          ) : null}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="px-3 pb-2">
          <PequiFiscal estado={estadoPequi} fala={falaPequi} corBrilho={corBrilho} vez={vezPequi} />
        </div>

        {gavetaDoResultado ? (
          <Gaveta>
            <div aria-live="polite" aria-atomic="true">
              {pensando ? (
                <p className="font-display text-xl font-bold">Hmm… deixa eu pensar.</p>
              ) : resultado && fluxoResposta === "cartao" ? (
                <CartaoResultado onResposta={responderCartao} desabilitado={analisando || esquecendo}>
                  <Resultado resultado={resultado} />
                </CartaoResultado>
              ) : resultado && fluxoResposta === "escolher" ? (
                <EscolherClasse onEscolha={corrigirResultado} onCancelar={cancelarCorrecao} />
              ) : resultado ? (
                <div className="grid gap-3">
                  <p className="font-display text-lg font-bold">
                    {fluxoResposta === "acertou" ? "Valeu! Anotei." : textoResposta}
                  </p>
                  <button type="button" onClick={() => setResultado(null)} className={botaoLargo}>
                    Próximo
                  </button>
                </div>
              ) : null}
            </div>
          </Gaveta>
        ) : ensinoAberto && estado === "pronto" ? (
          <Gaveta>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Ensinar o Pequi</h2>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setEnsinoAberto(false)}
                className="aperta flex size-11 cursor-pointer items-center justify-center rounded-full bg-page text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Aponta e toca na lixeira certa. Uns 10 de cada, mudando o ângulo.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[...categoriaIds, "vazio" as const].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => ensinar(id)}
                  disabled={analisando || esquecendo}
                  aria-label={`Ensinar ${id === "vazio" ? "Vazio" : categorias[id].nome} com o quadro atual`}
                  className={`aperta grid min-h-14 cursor-pointer place-items-center rounded-2xl px-2 font-display text-sm leading-tight font-bold disabled:opacity-60 ${
                    id === "vazio" ? "border-2 border-ink-soft bg-page text-ink" : ""
                  }`}
                  style={
                    id === "vazio"
                      ? undefined
                      : { backgroundColor: categorias[id].fundo, color: categorias[id].texto }
                  }
                >
                  {id === "vazio" ? "Vazio" : categorias[id].nome}
                  <span className="text-xs">{contagens[id]}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-soft">
              {sessao?.admin
                ? "Cê é admin: o que ensinar aqui vira a base que todo mundo usa."
                : sessao
                  ? "O que cê me ensina fica guardado e só vale pra você."
                  : "Sem internet, vale só enquanto a página estiver aberta."}
            </p>
            {!sessao?.admin ? (
              <button
                type="button"
                onClick={esquecer}
                disabled={esquecendo}
                className="aperta tinge min-h-11 cursor-pointer px-1 text-sm font-bold text-ink-soft underline disabled:opacity-60"
              >
                {esquecendo ? "Esquecendo…" : "Esquecer o que aprendi"}
              </button>
            ) : null}
          </Gaveta>
        ) : (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 pt-2 pb-8">
            <button
              type="button"
              onClick={() => setEnsinoAberto(true)}
              disabled={estado !== "pronto"}
              className="aperta min-h-11 cursor-pointer justify-self-start rounded-full bg-tinta/60 px-4 font-display font-bold text-creme disabled:opacity-50"
            >
              Ensinar
            </button>
            <button
              type="button"
              onClick={analisarObjeto}
              disabled={estado !== "pronto" || !podeAnalisar}
              aria-label={analisando ? "Olhando…" : "Analisar o objeto"}
              className="aperta size-20 cursor-pointer rounded-full border-4 border-creme bg-accent shadow-button disabled:opacity-50"
            />
            <span aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

const botaoRedondo =
  "aperta flex size-11 cursor-pointer items-center justify-center rounded-full bg-tinta/60 text-lg text-creme";
const pilula = "inline-block rounded-full bg-tinta/70 px-4 py-1.5 text-sm font-bold text-creme";
const botaoLargo =
  "aperta min-h-12 w-full cursor-pointer rounded-full bg-accent px-6 font-display font-bold text-on-accent";

/** Barra fina do topo: sair da lixeira à esquerda, os botões passados à direita. */
function BarraDoTopo({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Link href="/" aria-label="Sair da lixeira" className={botaoRedondo}>
        <span aria-hidden="true">←</span>
      </Link>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

/** Gaveta que sobe de baixo, por cima da câmera. */
function Gaveta({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-h-[60dvh] overflow-y-auto rounded-t-card bg-surface px-5 pt-5 pb-8 shadow-soft">
      {children}
    </div>
  );
}

function Resultado({ resultado }: { resultado: ResultadoMostrado }) {
  if (resultado.tipo === "nuvem") {
    const resposta = resultado.resposta;

    if (resposta.classe === "vazio") {
      return (
        <div className="rounded-card bg-page p-5 text-ink">
          <p className="font-display text-xl font-bold">Não vi nada na frente da câmera.</p>
        </div>
      );
    }

    const categoria = categorias[resposta.classe];
    const porcentagem = Math.round(resposta.certeza * 100);

    return (
      <div
        className="rounded-card p-5"
        style={{ backgroundColor: categoria.fundo, color: categoria.texto }}
      >
        <p className="font-display text-2xl font-bold">
          {categoria.cor} · {categoria.nome}
        </p>
        <p className="mt-1 font-bold">
          Lixeira {categoria.lixeira} · {porcentagem}% de certeza · perguntei pra nuvem
        </p>
      </div>
    );
  }

  const veredito = resultado.veredito;

  if (!veredito.aceito) {
    return (
      <div className="rounded-card bg-page p-5 text-ink">
        <p className="font-display text-xl font-bold">
          Fiquei na dúvida. Tenta de novo, mais perto.
        </p>
      </div>
    );
  }

  if (veredito.classe === "vazio") {
    return (
      <div className="rounded-card bg-page p-5 text-ink">
        <p className="font-display text-xl font-bold">Não vi nada na frente da câmera.</p>
      </div>
    );
  }

  const categoria = categorias[veredito.classe];
  const porcentagem = Math.round(veredito.confianca * 100);

  return (
    <div
      className="rounded-card p-5"
      style={{ backgroundColor: categoria.fundo, color: categoria.texto }}
    >
      <p className="font-display text-2xl font-bold">
        {categoria.cor} · {categoria.nome}
      </p>
      <p className="mt-1 font-bold">
        Lixeira {categoria.lixeira} · {porcentagem}% de certeza ({veredito.votos} de {veredito.total}{" "}
        quadros)
      </p>
    </div>
  );
}
