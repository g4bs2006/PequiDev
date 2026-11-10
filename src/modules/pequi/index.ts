import geometry from "./data/dormindo.json";

export { MemeCard } from "./components/MemeCard";
export { PequiDock } from "./components/PequiDock";
export { PequiNap } from "./components/PequiNap";
export { SleepingPequi } from "./components/SleepingPequi";
export { SpritePreview } from "./components/SpritePreview";
export { TocCompanion } from "./components/TocCompanion";
export {
  isPequiMeme,
  type PequiMeme,
  type PequiMemeName,
  pequiMemeNames,
  pequiMemes,
} from "./memes";

/** Medidas do Pequi dormindo, em frações da largura dele. */
export const sleepingPequi = {
  /** Do topo da imagem até a linha de apoio, onde o corpo encosta. */
  rise: (geometry.supportLine * geometry.height) / geometry.width,
  /** Do topo da orelha até a linha de apoio: a parte do gato visível acima dela. */
  bodyHeight: ((geometry.supportLine - geometry.top) * geometry.height) / geometry.width,
};
