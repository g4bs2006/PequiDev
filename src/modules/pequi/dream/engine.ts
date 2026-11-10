import {
  animation,
  CELL_H,
  CELL_W,
  SPRITE_URL,
  type AnimationName,
} from "../sprite";

const STEP = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;
const PLATFORM_REFRESH_MS = 500;

const BODY_LEFT = 15;
const BODY_RIGHT = 75;

const WALK_SPEED = 260;
const GROUND_ACCELERATION = 2_400;
const AIR_ACCELERATION = 1_450;
const GROUND_FRICTION = 2_800;
const AIR_FRICTION = 480;
const GRAVITY = 1_900;
const JUMP_SPEED = 740;
const JUMP_CUT_SPEED = 300;
const MAX_FALL_SPEED = 1_100;
const COYOTE_TIME = STEP * 6;
const JUMP_BUFFER_TIME = STEP * 6;

const SIT_AFTER = 8;
const SLEEP_AFTER = SIT_AFTER + 10;
const BREATH_TIME = 0.7;

const CONTROL_CODES = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "ArrowUp",
  "KeyA",
  "KeyD",
  "KeyS",
  "KeyW",
  "Space",
  "Escape",
]);

const LEFT_CODES = ["ArrowLeft", "KeyA"];
const RIGHT_CODES = ["ArrowRight", "KeyD"];
const DOWN_CODES = ["ArrowDown", "KeyS"];
const JUMP_CODES = ["ArrowUp", "KeyW", "Space"];

type Platform = {
  element: HTMLElement | null;
  left: number;
  right: number;
  top: number;
  ground: boolean;
};

type Support = HTMLElement | "ground" | null;

type Visual = {
  name: AnimationName;
  frame: number;
};

export type DreamEngine = {
  start: () => void;
  stop: () => void;
};

function approaches(value: number, target: number, amount: number) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

/** Motor do sonho. O React cuida só de criar e remover sua camada. */
export function createDreamEngine(
  canvas: HTMLCanvasElement,
  options: { onExit: () => void },
): DreamEngine {
  const context = canvas.getContext("2d");
  const sprite = new Image();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let reducedMotion = motion.matches;
  let active = false;
  let started = false;
  let paused = false;
  let exitRequested = false;

  let frameRequest = 0;
  let refreshTimer = 0;
  let lastTime = 0;
  let accumulator = 0;
  let platformsDirty = true;

  let platforms: Platform[] = [];
  let worldWidth = window.innerWidth;
  let worldHeight = document.documentElement.scrollHeight;

  let x = 0;
  let y = 0;
  let velocityX = 0;
  let velocityY = 0;
  let facing: 1 | -1 = 1;
  let support: Support = null;
  let dropThrough: HTMLElement | null = null;

  let coyoteTime = 0;
  let jumpBuffer = 0;
  let jumpCutRequested = false;
  let idleTime = 0;
  let gameTime = 0;
  let landingAge: number | null = null;

  const pressed = new Set<string>();

  sprite.decoding = "async";
  sprite.src = SPRITE_URL;

  const hasAny = (codes: string[]) => codes.some((code) => pressed.has(code));
  const isJumpHeld = () => hasAny(JUMP_CODES);
  const isDownHeld = () => hasAny(DOWN_CODES);

  function inputAxis() {
    const left = hasAny(LEFT_CODES) ? 1 : 0;
    const right = hasAny(RIGHT_CODES) ? 1 : 0;
    return right - left;
  }

  function pageSize() {
    const root = document.documentElement;
    const body = document.body;

    return {
      width: Math.max(
        window.innerWidth,
        root.scrollWidth,
        root.offsetWidth,
        body?.scrollWidth ?? 0,
        body?.offsetWidth ?? 0,
      ),
      height: Math.max(
        window.innerHeight,
        root.scrollHeight,
        root.offsetHeight,
        body?.scrollHeight ?? 0,
        body?.offsetHeight ?? 0,
      ),
    };
  }

  function readPlatforms() {
    const size = pageSize();
    worldWidth = size.width;
    worldHeight = size.height;

    const found = Array.from(
      document.querySelectorAll<HTMLElement>("[data-plataforma]"),
    ).flatMap((element): Platform[] => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return [];

      return [
        {
          element,
          left: rect.left + window.scrollX,
          right: rect.right + window.scrollX,
          top: rect.top + window.scrollY,
          ground: false,
        },
      ];
    });

    found.push({
      element: null,
      left: 0,
      right: worldWidth,
      top: worldHeight,
      ground: true,
    });

    platforms = found;
    platformsDirty = false;
  }

  function resizeCanvas() {
    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.imageSmoothingEnabled = false;
    platformsDirty = true;
  }

  function platformFor(current: Support) {
    if (current === null) return null;
    if (current === "ground") return platforms.find((platform) => platform.ground) ?? null;
    return platforms.find((platform) => platform.element === current) ?? null;
  }

  function overlaps(platform: Platform) {
    const left = x + BODY_LEFT;
    const right = x + BODY_RIGHT;
    return right > platform.left && left < platform.right;
  }

  function setSupport(platform: Platform) {
    support = platform.ground ? "ground" : platform.element;
    y = platform.top - CELL_H;
    velocityY = 0;
    landingAge = 0;
    idleTime = 0;
  }

  function clearInput() {
    pressed.clear();
    jumpCutRequested = false;
  }

  function onKeyDown(event: KeyboardEvent) {
    idleTime = 0;

    if (CONTROL_CODES.has(event.code)) event.preventDefault();

    if (event.code === "Escape") {
      if (!event.repeat && !exitRequested) {
        exitRequested = true;
        options.onExit();
      }
      return;
    }

    if (!CONTROL_CODES.has(event.code)) return;

    const wasPressed = pressed.has(event.code);
    pressed.add(event.code);

    if (JUMP_CODES.includes(event.code) && !wasPressed) {
      jumpBuffer = JUMP_BUFFER_TIME;
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    if (CONTROL_CODES.has(event.code)) event.preventDefault();

    pressed.delete(event.code);
    if (JUMP_CODES.includes(event.code) && !isJumpHeld()) {
      jumpCutRequested = true;
    }
  }

  function onScroll() {
    platformsDirty = true;
  }

  function onResize() {
    resizeCanvas();
    readPlatforms();
  }

  function onBlur() {
    clearInput();
  }

  function onMotionChange(event: MediaQueryListEvent) {
    reducedMotion = event.matches;
  }

  function onVisibilityChange() {
    if (!active) return;

    if (document.hidden) {
      paused = true;
      clearInput();
      window.cancelAnimationFrame(frameRequest);
      frameRequest = 0;
      return;
    }

    paused = false;
    accumulator = 0;
    lastTime = performance.now();
    readPlatforms();
    frameRequest = window.requestAnimationFrame(loop);
  }

  function updatePhysics(delta: number) {
    gameTime += delta;
    jumpBuffer = Math.max(0, jumpBuffer - delta);

    if (landingAge !== null) {
      landingAge += delta;
      if (landingAge >= 2 / animation("pulo").fps) landingAge = null;
    }

    if (jumpCutRequested) {
      if (velocityY < -JUMP_CUT_SPEED) velocityY = -JUMP_CUT_SPEED;
      jumpCutRequested = false;
    }

    let currentPlatform = platformFor(support);
    const feet = y + CELL_H;

    if (
      currentPlatform &&
      (!overlaps(currentPlatform) || Math.abs(feet - currentPlatform.top) > 3)
    ) {
      support = null;
      currentPlatform = null;
    }

    if (currentPlatform) {
      y = currentPlatform.top - CELL_H;
      velocityY = 0;
    }

    if (currentPlatform && isDownHeld() && !currentPlatform.ground) {
      dropThrough = currentPlatform.element;
      support = null;
      currentPlatform = null;
      coyoteTime = 0;
      y += 2;
      velocityY = Math.max(velocityY, 80);
      idleTime = 0;
    }

    if (currentPlatform) coyoteTime = COYOTE_TIME;
    else coyoteTime = Math.max(0, coyoteTime - delta);

    const axis = inputAxis();
    if (axis !== 0) {
      facing = axis > 0 ? 1 : -1;
      const acceleration = currentPlatform ? GROUND_ACCELERATION : AIR_ACCELERATION;
      velocityX = approaches(velocityX, axis * WALK_SPEED, acceleration * delta);
      idleTime = 0;
    } else {
      const friction = currentPlatform ? GROUND_FRICTION : AIR_FRICTION;
      velocityX = approaches(velocityX, 0, friction * delta);
    }

    x += velocityX * delta;
    const minX = -BODY_LEFT;
    const maxX = Math.max(minX, worldWidth - BODY_RIGHT);

    if (x < minX) {
      x = minX;
      velocityX = Math.max(0, velocityX);
    } else if (x > maxX) {
      x = maxX;
      velocityX = Math.min(0, velocityX);
    }

    if (currentPlatform && !overlaps(currentPlatform)) {
      support = null;
      currentPlatform = null;
    }

    if (jumpBuffer > 0 && coyoteTime > 0 && !isDownHeld()) {
      support = null;
      currentPlatform = null;
      velocityY = -JUMP_SPEED;
      jumpBuffer = 0;
      coyoteTime = 0;
      landingAge = null;
      idleTime = 0;
    }

    if (!currentPlatform) {
      const previousFeet = y + CELL_H;
      velocityY = Math.min(MAX_FALL_SPEED, velocityY + GRAVITY * delta);
      const nextY = y + velocityY * delta;
      const nextFeet = nextY + CELL_H;

      if (dropThrough) {
        const ignored = platforms.find((platform) => platform.element === dropThrough);
        if (!ignored || nextFeet > ignored.top + 10) dropThrough = null;
      }

      let landing: Platform | null = null;
      if (velocityY >= 0) {
        for (const platform of platforms) {
          if (platform.element === dropThrough || !overlaps(platform)) continue;
          if (previousFeet <= platform.top + 0.5 && nextFeet >= platform.top) {
            if (!landing || platform.top < landing.top) landing = platform;
          }
        }
      }

      if (landing) setSupport(landing);
      else y = nextY;
    }

    const resting = support !== null && axis === 0 && Math.abs(velocityX) < 1;
    if (resting) idleTime += delta;
    else idleTime = 0;
  }

  function visual(): Visual {
    if (support === null) {
      if (velocityY < -220) return { name: "pulo", frame: 1 };
      if (velocityY < 100) return { name: "pulo", frame: 2 };
      return { name: "pulo", frame: 3 };
    }

    if (landingAge !== null) {
      const frameTime = 1 / animation("pulo").fps;
      return { name: "pulo", frame: landingAge < frameTime ? 4 : 5 };
    }

    if (idleTime >= SLEEP_AFTER) {
      const sleepingFor = idleTime - SLEEP_AFTER;
      const layingDownTime = 5 / animation("dormir").fps;

      if (sleepingFor < layingDownTime) {
        return {
          name: "dormir",
          frame: Math.min(4, Math.floor(sleepingFor * animation("dormir").fps)),
        };
      }

      const breathingFor = sleepingFor - layingDownTime;
      return {
        name: "dormir",
        frame: Math.floor(breathingFor / BREATH_TIME) % 2 === 0 ? 4 : 5,
      };
    }

    if (idleTime >= SIT_AFTER) {
      const sittingFor = idleTime - SIT_AFTER;
      const meta = animation("sentar");
      return {
        name: "sentar",
        frame: Math.min(meta.quadros - 1, Math.floor(sittingFor * meta.fps)),
      };
    }

    if (Math.abs(velocityX) > 10) {
      const meta = animation("caminhada");
      return {
        name: "caminhada",
        frame: Math.floor(gameTime * meta.fps) % meta.quadros,
      };
    }

    const meta = animation("parado");
    return {
      name: "parado",
      frame: Math.floor(gameTime * meta.fps) % meta.quadros,
    };
  }

  function updateCamera(delta: number) {
    const current = window.scrollY;
    const feet = y + CELL_H;
    const screenFeet = feet - current;
    const upperEdge = window.innerHeight * 0.25;
    const lowerEdge = window.innerHeight * 0.7;

    let target = current;
    if (screenFeet < upperEdge) target = feet - window.innerHeight * 0.42;
    else if (screenFeet > lowerEdge) target = feet - window.innerHeight * 0.58;
    else return;

    const maximum = Math.max(0, worldHeight - window.innerHeight);
    target = Math.min(maximum, Math.max(0, target));

    const next = reducedMotion
      ? target
      : current + (target - current) * (1 - Math.exp(-8 * delta));

    if (Math.abs(next - current) < 0.5) return;

    window.scrollTo({
      top: next,
      left: window.scrollX,
      behavior: "instant",
    });
  }

  function render() {
    if (!context) return;

    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.imageSmoothingEnabled = false;

    // A física pode começar antes da imagem; o desenho espera sem travar o jogo.
    if (!sprite.complete || sprite.naturalWidth === 0) return;

    const current = visual();
    const meta = animation(current.name);
    const screenX = x - window.scrollX;
    const screenY = y - window.scrollY;
    const sourceX = current.frame * CELL_W;
    const sourceY = meta.linha * CELL_H;

    context.save();
    if (facing < 0) {
      context.translate(screenX + CELL_W, screenY);
      context.scale(-1, 1);
      context.drawImage(
        sprite,
        sourceX,
        sourceY,
        CELL_W,
        CELL_H,
        0,
        0,
        CELL_W,
        CELL_H,
      );
    } else {
      context.drawImage(
        sprite,
        sourceX,
        sourceY,
        CELL_W,
        CELL_H,
        screenX,
        screenY,
        CELL_W,
        CELL_H,
      );
    }
    context.restore();
  }

  function loop(time: number) {
    if (!active || paused) return;

    if (platformsDirty) readPlatforms();

    const frameDelta = Math.min(0.1, Math.max(0, (time - lastTime) / 1_000));
    lastTime = time;
    accumulator += frameDelta;

    let steps = 0;
    while (accumulator >= STEP && steps < MAX_STEPS_PER_FRAME) {
      updatePhysics(STEP);
      accumulator -= STEP;
      steps += 1;
    }

    // Descarta atraso excessivo para a volta à aba não disparar a física.
    if (steps === MAX_STEPS_PER_FRAME && accumulator >= STEP) accumulator = 0;

    updateCamera(frameDelta);
    render();
    frameRequest = window.requestAnimationFrame(loop);
  }

  function start() {
    if (started || !context) return;

    started = true;
    active = true;
    paused = document.hidden;
    exitRequested = false;

    resizeCanvas();
    readPlatforms();

    x = window.scrollX + window.innerWidth / 2 - CELL_W / 2;
    y = window.scrollY + Math.max(CELL_H + 24, window.innerHeight * 0.28) - CELL_H;
    velocityX = 0;
    velocityY = 0;
    support = null;
    dropThrough = null;
    coyoteTime = 0;
    jumpBuffer = 0;
    idleTime = 0;
    gameTime = 0;
    landingAge = null;

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motion.addEventListener("change", onMotionChange);

    refreshTimer = window.setInterval(() => {
      if (active && !paused) readPlatforms();
    }, PLATFORM_REFRESH_MS);

    accumulator = 0;
    lastTime = performance.now();
    if (!paused) frameRequest = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (!started) return;

    active = false;
    paused = false;
    window.cancelAnimationFrame(frameRequest);
    window.clearInterval(refreshTimer);
    clearInput();

    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    motion.removeEventListener("change", onMotionChange);

    if (context) context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  return { start, stop };
}
