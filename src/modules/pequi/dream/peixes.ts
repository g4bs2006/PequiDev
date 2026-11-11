export const FISH_PAGES = [
  "/",
  "/projetos",
  "/projetos/*",
  "/blog",
  "/brincar/sonho",
] as const;

const STORAGE_KEY = "pequidev:sonho:peixes";
const FISH_PAGE_SET = new Set<string>(FISH_PAGES);

type ScarfColors = {
  light: string;
  dark: string;
};

/** Traduz o endereço atual para uma das cinco chaves da coleção. */
export function fishKey(pathname: string) {
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");

  if (normalized.startsWith("/projetos/")) return "/projetos/*";
  return FISH_PAGE_SET.has(normalized) ? normalized : null;
}

/** Lê só as chaves conhecidas; armazenamento bloqueado não interrompe o jogo. */
export function readCollected() {
  const collected = new Set<string>();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return collected;

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return collected;

    for (const value of parsed) {
      if (typeof value === "string" && FISH_PAGE_SET.has(value)) {
        collected.add(value);
      }
    }
  } catch {
    return collected;
  }

  return collected;
}

/** Salva em ordem estável e descarta qualquer chave que não pertença ao jogo. */
export function saveCollected(collected: Set<string>) {
  try {
    const known = FISH_PAGES.filter((key) => collected.has(key));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(known));
  } catch {
    // Sem armazenamento, a coleção ainda vale durante esta sessão do sonho.
  }
}

/** FNV-1a de 32 bits: pequeno, estável e sempre não negativo. */
export function hashString(text: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function cssRgb(
  color: string,
  context: CanvasRenderingContext2D,
): [number, number, number] | null {
  try {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const data = context.getImageData(0, 0, 1, 1).data;
    return [data[0], data[1], data[2]];
  } catch {
    return null;
  }
}

function near(
  red: number,
  green: number,
  blue: number,
  expected: readonly [number, number, number],
) {
  return (
    Math.abs(red - expected[0]) <= 2 &&
    Math.abs(green - expected[1]) <= 2 &&
    Math.abs(blue - expected[2]) <= 2
  );
}

/** Copia a folha e troca somente os dois verdes exatos do lenço. */
export function recolorScarf(image: HTMLImageElement, colors: ScarfColors) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const colorCanvas = document.createElement("canvas");
  const colorContext = colorCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context || !colorContext) return null;

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  colorCanvas.width = 1;
  colorCanvas.height = 1;

  const light = cssRgb(colors.light, colorContext);
  const dark = cssRgb(colors.dark, colorContext);
  if (!light || !dark) return null;

  try {
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = pixels.data;
    const scarfLight = [0x87, 0xb2, 0x74] as const;
    const scarfDark = [0x5f, 0x83, 0x4d] as const;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      if (near(red, green, blue, scarfLight)) {
        data[index] = light[0];
        data[index + 1] = light[1];
        data[index + 2] = light[2];
      } else if (near(red, green, blue, scarfDark)) {
        data[index] = dark[0];
        data[index + 1] = dark[1];
        data[index + 2] = dark[2];
      }
    }

    context.putImageData(pixels, 0, 0);
    return canvas;
  } catch {
    return null;
  }
}
