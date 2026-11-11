export type WorldPlatform = {
  left: number;
  right: number;
  top: number;
  ground: boolean;
};

/** O que o motor mostra aos objetos a cada passo. Coordenadas do documento. */
export type WorldView = {
  platforms: readonly WorldPlatform[];
  worldWidth: number;
  gravity: number;
  maxFallSpeed: number;
  /** Caixa do corpo do gato e para onde ele anda. */
  cat: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    velocityX: number;
    facing: 1 | -1;
    grounded: boolean;
  };
};

export type WorldColors = {
  yarn: string;
  yarnLine: string;
};

export interface WorldObject {
  readonly kind: "novelo";
  /** Caixa atual, para a patada e para colisões. */
  bounds(): { left: number; right: number; top: number; bottom: number };
  update(delta: number, world: WorldView): void;
  /** A pata acertou: `facing` é o lado para onde o gato olha. */
  kick(facing: 1 | -1): void;
  render(
    context: CanvasRenderingContext2D,
    scrollX: number,
    scrollY: number,
    colors: WorldColors,
  ): void;
}

export const YARN_SIZE = 16;
const YARN_RADIUS = 8;
const YARN_FRICTION = 320;
const YARN_MAX_SPEED = 700;
const YARN_KICK_SPEED = 460;
const YARN_KICK_RISE = 320;
const YARN_BOUNCE_SPEED = 220;
const YARN_BOUNCE_FACTOR = 0.35;

// O desenho é uma grade de 8×8 com pixels de 2 px, a mesma escala do sprite
// do gato (16 px na tela).
const YARN_GRID = 8;
const YARN_PIXEL = YARN_SIZE / YARN_GRID;

const CIRCLE_ROWS = [
  [2, 5],
  [1, 6],
  [0, 7],
  [0, 7],
  [0, 7],
  [0, 7],
  [1, 6],
  [2, 5],
] as const;

// Três fios de lã na diagonal dão o volume sem suavizar o canvas.
const YARN_LINES = new Set([
  "1,2",
  "2,1",
  "1,5",
  "2,4",
  "3,3",
  "4,2",
  "5,1",
  "3,6",
  "4,5",
  "5,4",
  "6,3",
]);

function approaches(value: number, target: number, amount: number) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

function overlapsHorizontally(
  bounds: { left: number; right: number },
  platform: WorldPlatform,
) {
  return bounds.right > platform.left && bounds.left < platform.right;
}

function boxesTouch(
  first: { left: number; right: number; top: number; bottom: number },
  second: { left: number; right: number; top: number; bottom: number },
) {
  return (
    first.right >= second.left &&
    first.left <= second.right &&
    first.bottom >= second.top &&
    first.top <= second.bottom
  );
}

function samePlatform(first: WorldPlatform, second: WorldPlatform) {
  if (first.ground && second.ground) return true;

  return (
    first.ground === second.ground &&
    first.left === second.left &&
    first.right === second.right &&
    first.top === second.top
  );
}

/** Encontra o primeiro pouso atravessado de cima para baixo. */
export function findLandingPlatform(
  bounds: { left: number; right: number },
  previousBottom: number,
  nextBottom: number,
  platforms: readonly WorldPlatform[],
) {
  let landing: WorldPlatform | null = null;

  for (const platform of platforms) {
    if (!overlapsHorizontally(bounds, platform)) continue;

    const crossed = platform.ground || previousBottom <= platform.top + 0.5;
    if (!crossed || nextBottom < platform.top) continue;

    if (!landing || platform.top < landing.top) landing = platform;
  }

  return landing;
}

function rotatedPixel(x: number, y: number, frame: number) {
  const last = YARN_GRID - 1;
  if (frame === 1) return { x: last - y, y: x };
  if (frame === 2) return { x: last - x, y: last - y };
  if (frame === 3) return { x: y, y: last - x };
  return { x, y };
}

class YarnObject implements WorldObject {
  readonly kind = "novelo";

  private x: number;
  private y: number;
  private velocityX = 0;
  private velocityY = 0;
  private angle = 0;
  private support: WorldPlatform | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  place(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.angle = 0;
    this.support = null;
  }

  bounds() {
    return {
      left: this.x,
      right: this.x + YARN_SIZE,
      top: this.y,
      bottom: this.y + YARN_SIZE,
    };
  }

  update(delta: number, world: WorldView) {
    let currentPlatform = this.support
      ? (world.platforms.find((platform) =>
          samePlatform(platform, this.support as WorldPlatform),
        ) ?? null)
      : null;

    if (
      currentPlatform &&
      (!overlapsHorizontally(this.bounds(), currentPlatform) ||
        Math.abs(this.y + YARN_SIZE - currentPlatform.top) > 1)
    ) {
      currentPlatform = null;
      this.support = null;
    }

    if (currentPlatform) {
      this.y = currentPlatform.top - YARN_SIZE;
      this.velocityY = 0;
      this.velocityX = approaches(
        this.velocityX,
        0,
        YARN_FRICTION * delta,
      );
    }

    const cat = world.cat;
    const bounds = this.bounds();
    const catCenter = (cat.left + cat.right) / 2;
    const yarnCenter = (bounds.left + bounds.right) / 2;
    const yarnIsAhead =
      cat.facing > 0 ? yarnCenter >= catCenter : yarnCenter <= catCenter;
    const catWalksForward = cat.velocityX * cat.facing > 0;

    if (
      cat.grounded &&
      catWalksForward &&
      yarnIsAhead &&
      boxesTouch(bounds, cat)
    ) {
      this.x = cat.facing > 0 ? cat.right : cat.left - YARN_SIZE;
      this.velocityX =
        cat.facing *
        Math.min(
          YARN_MAX_SPEED,
          Math.max(Math.abs(this.velocityX), Math.abs(cat.velocityX) + 60),
        );
    }

    this.velocityX = Math.max(
      -YARN_MAX_SPEED,
      Math.min(YARN_MAX_SPEED, this.velocityX),
    );
    this.x += this.velocityX * delta;

    const maximumX = Math.max(0, world.worldWidth - YARN_SIZE);
    if (this.x < 0) {
      this.x = 0;
      this.velocityX = -this.velocityX * 0.5;
    } else if (this.x > maximumX) {
      this.x = maximumX;
      this.velocityX = -this.velocityX * 0.5;
    }

    this.angle += (this.velocityX * delta) / YARN_RADIUS;

    if (
      currentPlatform &&
      !overlapsHorizontally(this.bounds(), currentPlatform)
    ) {
      currentPlatform = null;
      this.support = null;
    }

    if (currentPlatform) return;

    const previousBottom = this.y + YARN_SIZE;
    this.velocityY = Math.min(
      world.maxFallSpeed,
      this.velocityY + world.gravity * delta,
    );
    const nextY = this.y + this.velocityY * delta;
    const nextBottom = nextY + YARN_SIZE;
    const landing = findLandingPlatform(
      this.bounds(),
      previousBottom,
      nextBottom,
      world.platforms,
    );

    if (!landing) {
      this.y = nextY;
      return;
    }

    this.y = landing.top - YARN_SIZE;

    if (this.velocityY > YARN_BOUNCE_SPEED) {
      this.velocityY = -this.velocityY * YARN_BOUNCE_FACTOR;
      this.support = null;
      return;
    }

    this.velocityY = 0;
    this.support = landing;
  }

  kick(facing: 1 | -1) {
    this.velocityX = facing * YARN_KICK_SPEED;
    this.velocityY = -YARN_KICK_RISE;
    this.support = null;
  }

  render(
    context: CanvasRenderingContext2D,
    scrollX: number,
    scrollY: number,
    colors: WorldColors,
  ) {
    const left = Math.round(this.x - scrollX);
    const top = Math.round(this.y - scrollY);
    const quarterTurn = Math.PI / 2;
    const frame =
      ((Math.floor(this.angle / quarterTurn) % 4) + 4) % 4;

    context.imageSmoothingEnabled = false;

    for (let y = 0; y < YARN_GRID; y += 1) {
      const [start, end] = CIRCLE_ROWS[y];

      for (let x = start; x <= end; x += 1) {
        const pixel = rotatedPixel(x, y, frame);
        context.fillStyle = YARN_LINES.has(`${x},${y}`)
          ? colors.yarnLine
          : colors.yarn;
        context.fillRect(
          left + pixel.x * YARN_PIXEL,
          top + pixel.y * YARN_PIXEL,
          YARN_PIXEL,
          YARN_PIXEL,
        );
      }
    }
  }
}

export function createYarn(x: number, y: number): WorldObject {
  return new YarnObject(x, y);
}

/** Reaproveita o objeto para não acumular novelos no mundo. */
export function repositionWorldObject(
  object: WorldObject,
  x: number,
  y: number,
) {
  if (object instanceof YarnObject) object.place(x, y);
}
