// Service worker da Lixeira do Pequi (escopo /lixeira). Guarda o necessário
// para o app instalado abrir e classificar sem internet. Ver docs/lixeira.md,
// etapa 6. Trocar VERSAO apaga os caches antigos.

const VERSAO = "lixeira-v1";

const ESSENCIAIS = [
  "/lixeira",
  "/lixeira/manifest.webmanifest",
  "/lixeira/icone-192.png",
  "/lixeira/modelo/model.json",
  "/lixeira/modelo/group1-shard1of4.bin",
  "/lixeira/modelo/group1-shard2of4.bin",
  "/lixeira/modelo/group1-shard3of4.bin",
  "/lixeira/modelo/group1-shard4of4.bin",
  "/pequi/sprite/pequi.png",
  "/pequi/chapeus/lixeira.png",
];

// Arquivos que não mudam sem mudar de nome: primeiro o cache.
const IMUTAVEIS = ["/_next/static/", "/_next/image", "/lixeira/modelo/", "/pequi/"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ESSENCIAIS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((nome) => nome.startsWith("lixeira-") && nome !== VERSAO)
            .map((nome) => caches.delete(nome)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// A página manda os arquivos que usou (o código da câmera e do TensorFlow só
// chega depois do toque, com nomes que mudam a cada versão do site).
self.addEventListener("message", (evento) => {
  if (evento.data?.tipo !== "guardar" || !Array.isArray(evento.data.urls)) return;
  const urls = evento.data.urls.filter(
    (url) => typeof url === "string" && new URL(url).origin === self.location.origin,
  );
  evento.waitUntil(
    caches.open(VERSAO).then((cache) =>
      Promise.all(urls.map((url) => cache.add(url).catch(() => undefined))),
    ),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  // Páginas da lixeira: rede primeiro (versão nova), cache se estiver sem internet.
  if (pedido.mode === "navigate" && url.pathname.startsWith("/lixeira")) {
    evento.respondWith(
      fetch(pedido)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(VERSAO).then((cache) => cache.put(pedido, copia));
          return resposta;
        })
        .catch(() => caches.match(pedido).then((r) => r ?? caches.match("/lixeira"))),
    );
    return;
  }

  if (IMUTAVEIS.some((prefixo) => url.pathname.startsWith(prefixo))) {
    evento.respondWith(
      caches.match(pedido).then(
        (guardada) =>
          guardada ??
          fetch(pedido).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(VERSAO).then((cache) => cache.put(pedido, copia));
            }
            return resposta;
          }),
      ),
    );
  }
});
