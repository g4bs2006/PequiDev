import geometry from "./data/dormindo.json";

export { SleepingPequi } from "./components/SleepingPequi";
export { SpritePreview } from "./components/SpritePreview";

/** Medidas do Pequi dormindo, em frações da largura dele. */
export const sleepingPequi = {
  /** Do topo da imagem até a linha de apoio, onde o corpo encosta. */
  rise: (geometry.supportLine * geometry.height) / geometry.width,
  /** Do topo da orelha até a linha de apoio: a parte do gato visível acima dela. */
  bodyHeight: ((geometry.supportLine - geometry.top) * geometry.height) / geometry.width,
};
