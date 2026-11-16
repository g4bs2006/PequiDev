import {
  baixarExemplosDesde,
  type ExemploSalvo,
  type Sessao,
} from "./queries";

const NOME_BANCO = "pequidev-lixeira";
const VERSAO_BANCO = 1;
const CHAVE_ESTADO = "estado";

type EstadoCache = {
  chave: typeof CHAVE_ESTADO;
  userId: string;
  ultimaSync: string | null;
};

function requisicao<T>(pedido: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error ?? new Error("Falha no IndexedDB."));
  });
}

function esperarTransacao(transacao: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transacao.oncomplete = () => resolve();
    transacao.onerror = () => reject(transacao.error ?? new Error("Falha no IndexedDB."));
    transacao.onabort = () => reject(transacao.error ?? new Error("Falha no IndexedDB."));
  });
}

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new Error("IndexedDB indisponível."));
      return;
    }

    const pedido = indexedDB.open(NOME_BANCO, VERSAO_BANCO);
    let terminou = false;

    pedido.onupgradeneeded = () => {
      const banco = pedido.result;

      if (!banco.objectStoreNames.contains("exemplos")) {
        banco.createObjectStore("exemplos", { keyPath: "id" });
      }

      if (!banco.objectStoreNames.contains("meta")) {
        banco.createObjectStore("meta", { keyPath: "chave" });
      }
    };

    pedido.onsuccess = () => {
      if (terminou) {
        pedido.result.close();
        return;
      }
      terminou = true;
      resolve(pedido.result);
    };

    pedido.onerror = () => {
      if (terminou) return;
      terminou = true;
      reject(pedido.error ?? new Error("Não consegui abrir o IndexedDB."));
    };

    pedido.onblocked = () => {
      if (terminou) return;
      terminou = true;
      reject(new Error("O IndexedDB está bloqueado."));
    };
  });
}

async function lerCache(banco: IDBDatabase) {
  const transacao = banco.transaction(["exemplos", "meta"], "readonly");
  const terminou = esperarTransacao(transacao);
  const exemplos = requisicao(
    transacao.objectStore("exemplos").getAll() as IDBRequest<ExemploSalvo[]>,
  );
  const estado = requisicao(
    transacao.objectStore("meta").get(CHAVE_ESTADO) as IDBRequest<EstadoCache | undefined>,
  );
  const resultado = await Promise.all([exemplos, estado]);
  await terminou;

  return { exemplos: resultado[0], estado: resultado[1] };
}

async function limparCache(banco: IDBDatabase) {
  const transacao = banco.transaction(["exemplos", "meta"], "readwrite");
  const terminou = esperarTransacao(transacao);
  transacao.objectStore("exemplos").clear();
  transacao.objectStore("meta").clear();
  await terminou;
}

function maiorAtualizacao(atual: string | null, candidata: string) {
  if (!atual) return candidata;

  const tempoAtual = Date.parse(atual);
  const tempoCandidata = Date.parse(candidata);

  if (Number.isFinite(tempoAtual) && Number.isFinite(tempoCandidata)) {
    return tempoCandidata > tempoAtual ? candidata : atual;
  }

  return candidata > atual ? candidata : atual;
}

/** Junta o cache com o que mudou no banco e devolve os exemplos ativos. */
export async function sincronizarExemplos(sessao: Sessao): Promise<ExemploSalvo[]> {
  let banco: IDBDatabase | null = null;

  try {
    banco = await abrirBanco();
    let { exemplos, estado } = await lerCache(banco);

    if (!estado || estado.userId !== sessao.userId) {
      await limparCache(banco);
      exemplos = [];
      estado = {
        chave: CHAVE_ESTADO,
        userId: sessao.userId,
        ultimaSync: null,
      };
    }

    const mudancas = await baixarExemplosDesde(sessao, estado.ultimaSync);
    const porId = new Map(exemplos.map((exemplo) => [exemplo.id, exemplo]));
    let ultimaSync = estado.ultimaSync;

    for (const exemplo of mudancas) {
      if (exemplo.ativo) porId.set(exemplo.id, exemplo);
      else porId.delete(exemplo.id);
      ultimaSync = maiorAtualizacao(ultimaSync, exemplo.updatedAt);
    }

    const transacao = banco.transaction(["exemplos", "meta"], "readwrite");
    const terminou = esperarTransacao(transacao);
    const lojaExemplos = transacao.objectStore("exemplos");

    for (const exemplo of mudancas) {
      if (exemplo.ativo) lojaExemplos.put(exemplo);
      else lojaExemplos.delete(exemplo.id);
    }

    transacao.objectStore("meta").put({
      chave: CHAVE_ESTADO,
      userId: sessao.userId,
      ultimaSync,
    } satisfies EstadoCache);

    await terminou;
    return [...porId.values()].filter((exemplo) => exemplo.ativo);
  } catch {
    const exemplos = await baixarExemplosDesde(sessao, null);
    return exemplos.filter((exemplo) => exemplo.ativo);
  } finally {
    banco?.close();
  }
}

/** Acrescenta ao cache um exemplo que acabou de ser salvo. */
export async function guardarNoCache(
  sessao: Sessao,
  exemplo: ExemploSalvo,
): Promise<void> {
  let banco: IDBDatabase | null = null;

  try {
    banco = await abrirBanco();
    const { estado } = await lerCache(banco);
    let estadoAtual = estado;

    if (!estadoAtual || estadoAtual.userId !== sessao.userId) {
      await limparCache(banco);
      estadoAtual = {
        chave: CHAVE_ESTADO,
        userId: sessao.userId,
        ultimaSync: null,
      };
    }

    const transacao = banco.transaction(["exemplos", "meta"], "readwrite");
    const terminou = esperarTransacao(transacao);
    const lojaExemplos = transacao.objectStore("exemplos");

    if (exemplo.ativo) lojaExemplos.put(exemplo);
    else lojaExemplos.delete(exemplo.id);

    transacao.objectStore("meta").put(estadoAtual);
    await terminou;
  } catch {
    // O banco continua sendo a fonte de verdade se o cache local falhar.
  } finally {
    banco?.close();
  }
}
