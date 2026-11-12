import { slugify } from "@/lib/slug";
import { getBrowserClient } from "@/lib/supabase/browser";

/** O bucket público do site (migração bucket_de_imagens). */
const BUCKET = "imagens";
/** Largura máxima das imagens enviadas; maiores são reduzidas. */
const MAX_WIDTH = 1600;
const QUALITY = 0.82;

/** Reduz e converte para WebP no navegador. PNG com transparência continua WebP (que mantém). */
async function toWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não deu para converter a imagem."))),
      "image/webp",
      QUALITY,
    ),
  );
}

/**
 * Envia uma imagem para o Storage, já em WebP e no máximo 1600 px de largura,
 * e devolve o endereço público. `folder` separa por uso: "posts", "projetos".
 */
export async function uploadImage(file: File, folder: string) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    throw new Error("Envie uma imagem JPG, PNG, WebP ou AVIF.");
  }

  const blob = await toWebp(file);
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "imagem";
  const path = `${folder}/${Date.now().toString(36)}-${base}.webp`;

  const supabase = getBrowserClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error(`O envio falhou: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
