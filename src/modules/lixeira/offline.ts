/**
 * App instalável e offline da lixeira (etapa 6): o service worker fica em
 * public/lixeira/sw.js, com escopo /lixeira. Só em produção: em
 * desenvolvimento ele guardaria arquivos que mudam a cada salvamento.
 */
export function registrarAppDaLixeira() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("/lixeira/sw.js", { scope: "/lixeira", updateViaCache: "none" })
    .catch(() => undefined);
}

/**
 * Pede ao service worker para guardar os arquivos que a página já usou. O
 * código da câmera e do TensorFlow só chega depois do toque e muda de nome a
 * cada versão, então não dá para listar de antemão.
 */
export function guardarParaOffline() {
  try {
    const sw = navigator.serviceWorker?.controller;
    if (!sw) return;
    const urls = performance
      .getEntriesByType("resource")
      .map((entrada) => entrada.name)
      .filter((url) => url.startsWith(location.origin));
    sw.postMessage({ tipo: "guardar", urls });
  } catch {
    // Sem service worker, o app só não abre offline.
  }
}
