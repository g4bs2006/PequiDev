/** Quadro atual do vídeo em JPEG, no máximo 384 px no lado maior, qualidade 0,7. */
export function capturarFoto(video: HTMLVideoElement): Promise<Blob> {
  const larguraOriginal = video.videoWidth;
  const alturaOriginal = video.videoHeight;

  if (larguraOriginal <= 0 || alturaOriginal <= 0) {
    return Promise.reject(new Error("Ainda não há um quadro da câmera."));
  }

  const escala = Math.min(1, 384 / Math.max(larguraOriginal, alturaOriginal));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(larguraOriginal * escala));
  canvas.height = Math.max(1, Math.round(alturaOriginal * escala));

  const contexto = canvas.getContext("2d");
  if (!contexto) return Promise.reject(new Error("Não consegui preparar a foto."));

  contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (foto) => foto ? resolve(foto) : reject(new Error("Não consegui tirar a foto.")),
      "image/jpeg",
      0.7,
    );
  });
}
