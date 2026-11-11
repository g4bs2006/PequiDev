import {
  BOX_HEIGHT,
  BOX_WIDTH,
  createBox,
  createFish,
  createYarn,
  repositionWorldObject,
  YARN_SIZE,
  type WorldColors,
  type WorldObject,
  type WorldView,
} from "./objetos";
import {
  FISH_PAGES,
  fishKey,
  hashString,
  readCollected,
  recolorScarf,
  saveCollected,
} from "./peixes";
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
const PAW_REACH = 28;
const PAW_HIT_FRAME = 2;
const OBJECT_EXTRA_REACH = 32;
const BOX_DELAY_MS = 700;
// Títulos e parágrafos ocupam a largura toda; o limite de altura é que
// segura as seções inteiras. Quanto mais largo, menos ele tomba.
const KNOCK_MAX_WIDTH = 1_400;
const KNOCK_FULL_TILT_WIDTH = 220;
const KNOCK_MAX_HEIGHT = 260;
const KNOCK_MOVEMENT_FALLBACK = 400;
const KNOCK_QUICK_FALLBACK = 150;
const KNOCK_EXIT_CURVE_FALLBACK = "ease-in";
const KNOCK_POUNCE_CURVE_FALLBACK = "ease-out";
const KNOCK_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "P",
  "LI",
  "A",
  "BUTTON",
  "IMG",
  "SVG",
  "FIGURE",
  "PICTURE",
  "CODE",
  "PRE",
  "TIME",
  "SPAN",
]);
const KNOCK_IGNORED_TAGS = new Set(["HTML", "BODY", "MAIN"]);

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

// "z" do sono: letra de 5×5 pixels, desenhada em blocos, como o sprite.
const Z_GLYPH = ["11111", "00010", "00100", "01000", "11111"];
const Z_COUNT = 3;
const Z_CYCLE = 2.4;
const Z_RISE = 34;

// Balão do comentário (data-pequi-comenta no card onde ele pisa).
const SPEECH_TIME = 6;
const SPEECH_FONT_SIZE = 13;
const SPEECH_LINE_HEIGHT = 17;
const SPEECH_MAX_WIDTH = 220;
const SPEECH_PADDING = 8;
const SPEECH_BORDER = 2;
const SPEECH_TAIL = 6;

const LASER_DOT_SIZE = 6;
const LASER_HALO_SIZE = 14;
const LASER_HALO_CYCLE = 0.8;
const LASER_INITIAL_DISTANCE = 140;
const LASER_PAW_DISTANCE = 40;
const LASER_PAW_INTERVAL = 1.5;

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
  "KeyX",
  "KeyJ",
  "KeyL",
  "KeyN",
  "Space",
  "Enter",
  "Escape",
]);

const LEFT_CODES = ["ArrowLeft", "KeyA"];
const RIGHT_CODES = ["ArrowRight", "KeyD"];
const DOWN_CODES = ["ArrowDown", "KeyS"];
const JUMP_CODES = ["ArrowUp", "KeyW", "Space"];
const PAW_CODES = ["KeyX", "KeyJ"];

export type DreamAction =
  | "esquerda"
  | "direita"
  | "pular"
  | "descer"
  | "patada"
  | "abrir";

export type DreamOrigin = {
  x: number;
  y: number;
};

type Platform = {
  element: HTMLElement | null;
  object: WorldObject | null;
  left: number;
  right: number;
  top: number;
  ground: boolean;
};

type PlatformOwner = HTMLElement | WorldObject;
type Support = PlatformOwner | "ground" | null;

type Visual = {
  name: AnimationName;
  frame: number;
};

type OpenTarget = {
  href: string;
  name: string;
};

type PilotInput = {
  axis: -1 | 0 | 1;
  jumping: boolean;
  down: boolean;
};

type LaserPaw = DreamOrigin & {
  time: number;
};

/** Coleção de peixinhos: quantos já pegou e se ganhou o lenço novo. */
export type FishInfo = {
  count: number;
  total: number;
  justCaught: boolean;
  prize: boolean;
};

export type DreamEngine = {
  start: (origem?: DreamOrigin | null) => void;
  stop: () => void;
  respawn: () => void;
  dropYarn: () => void;
  setAction: (action: DreamAction, pressed: boolean) => void;
  setLaser: (ativo: boolean) => void;
};

function approaches(value: number, target: number, amount: number) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

function shortText(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= 40) return clean;
  return `${clean.slice(0, 39).trimEnd()}…`;
}

/** Motor do sonho. O React cuida só de criar e remover sua camada. */
export function createDreamEngine(
  canvas: HTMLCanvasElement,
  options: {
    onExit: () => void;
    onOpen: (href: string) => void;
    onHint: (hint: string | null) => void;
    onLaserChange: (ativo: boolean) => void;
    onFish: (info: FishInfo) => void;
    /** O comentário que o Pequi acabou de dizer (ou null quando para). */
    onSpeech: (text: string | null) => void;
  },
): DreamEngine {
  const context = canvas.getContext("2d");
  const sprite = new Image();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const knockedThings = new WeakSet<Element>();
  const objects: WorldObject[] = [];

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

  let domPlatforms: Platform[] = [];
  // A caixa espera a página nova assentar: na troca de página o DOM ainda
  // pode ser o da anterior (ver respawn).
  let boxDueAt = 0;
  let platforms: Platform[] = [];
  let worldWidth = window.innerWidth;
  let worldHeight = document.documentElement.scrollHeight;
  let groundPlatform: Platform = {
    element: null,
    object: null,
    left: 0,
    right: worldWidth,
    top: worldHeight,
    ground: true,
  };

  let x = 0;
  let y = 0;
  let velocityX = 0;
  let velocityY = 0;
  let facing: 1 | -1 = 1;
  let support: Support = null;
  let dropThrough: PlatformOwner | null = null;

  let coyoteTime = 0;
  let jumpBuffer = 0;
  let jumpCutRequested = false;
  let idleTime = 0;
  let gameTime = 0;
  let landingAge: number | null = null;
  let pawTime: number | null = null;
  let pawHit = false;
  let currentHint: string | null = null;
  let zColor = "";
  // O comentário dito e o card de onde veio, para não repetir sem sair dele.
  let speech: { text: string; source: HTMLElement; age: number } | null = null;
  let speechColors = { fill: "", ink: "", font: "" };
  let laserColor = "";
  let worldColors: WorldColors = {
    yarn: "",
    yarnLine: "",
    box: "",
    boxCrease: "",
    boxInside: "",
    fish: "",
    fishDark: "",
    fishEye: "",
  };

  // Peixinhos: o que já foi pego fica no navegador (ver peixes.ts).
  let collectedFish = new Set<string>();
  let activeFishKey: string | null = null;
  let hasPrize = false;
  // O lenço novo é a folha de sprites com os dois verdes trocados.
  let scarfLight = "";
  let scarfDark = "";
  let scarfSheet: HTMLCanvasElement | null = null;
  let scarfAttempted = false;
  let movementDuration = KNOCK_MOVEMENT_FALLBACK;
  let quickDuration = KNOCK_QUICK_FALLBACK;
  let exitCurve = KNOCK_EXIT_CURVE_FALLBACK;
  let pounceCurve = KNOCK_POUNCE_CURVE_FALLBACK;

  let laserActive = false;
  let laserTarget: DreamOrigin | null = null;
  let laserJumpUsed = false;
  let laserJumpHeld = false;
  let laserLastPaw: LaserPaw | null = null;

  const pressed = new Set<string>();
  const actions = new Set<DreamAction>();

  sprite.decoding = "async";
  sprite.src = SPRITE_URL;

  function publishFish(justCaught: boolean) {
    options.onFish({
      count: collectedFish.size,
      total: FISH_PAGES.length,
      justCaught,
      prize: hasPrize,
    });
  }

  /** Monta a folha com o lenço novo quando a imagem já carregou. */
  function preparePrizeSprite() {
    if (!hasPrize || scarfSheet || scarfAttempted) return;
    if (!sprite.complete || sprite.naturalWidth <= 0) return;

    scarfAttempted = true;
    scarfSheet = recolorScarf(sprite, { light: scarfLight, dark: scarfDark });
  }

  const hasAny = (codes: string[]) => codes.some((code) => pressed.has(code));
  const isJumpHeld = () => hasAny(JUMP_CODES) || actions.has("pular");
  const isDownHeld = () => hasAny(DOWN_CODES) || actions.has("descer");

  function inputAxis() {
    const left = hasAny(LEFT_CODES) || actions.has("esquerda") ? 1 : 0;
    const right = hasAny(RIGHT_CODES) || actions.has("direita") ? 1 : 0;
    return right - left;
  }

  function hasManualMovement() {
    return (
      hasAny(LEFT_CODES) ||
      hasAny(RIGHT_CODES) ||
      hasAny(DOWN_CODES) ||
      hasAny(JUMP_CODES) ||
      actions.has("esquerda") ||
      actions.has("direita") ||
      actions.has("descer") ||
      actions.has("pular")
    );
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

  function isBeingKnocked(element: Element) {
    for (
      let current: Element | null = element;
      current;
      current = current.parentElement
    ) {
      if (knockedThings.has(current)) return true;
    }
    return false;
  }

  function refreshObjectPlatforms() {
    const objectPlatforms = objects.flatMap((object): Platform[] => {
      const offered = object.platform?.() ?? null;
      if (!offered) return [];

      return [
        {
          element: null,
          object,
          left: offered.left,
          right: offered.right,
          top: offered.top,
          ground: false,
        },
      ];
    });

    platforms = [...domPlatforms, ...objectPlatforms, groundPlatform];
  }

  function readPlatforms() {
    const size = pageSize();
    worldWidth = size.width;
    worldHeight = size.height;

    const found = Array.from(
      document.querySelectorAll<HTMLElement>("[data-plataforma]"),
    ).flatMap((element): Platform[] => {
      // Tombando pela patada, a caixa medida gira e sobe: fica valendo a de
      // antes da queda, senão o gato e o novelo atravessam a plataforma.
      if (isBeingKnocked(element)) {
        const before = domPlatforms.find(
          (platform) => platform.element === element,
        );
        if (before) return [before];
      }

      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return [];

      return [
        {
          element,
          object: null,
          left: rect.left + window.scrollX,
          right: rect.right + window.scrollX,
          // data-plataforma="base": o chão é a borda de baixo (o menu do topo,
          // onde ele anda ao lado dos botões); nos outros, a borda de cima.
          top:
            (element.dataset.plataforma === "base" ? rect.bottom : rect.top) +
            window.scrollY,
          ground: false,
        },
      ];
    });

    domPlatforms = found;
    groundPlatform = {
      element: null,
      object: null,
      left: 0,
      right: worldWidth,
      top: worldHeight,
      ground: true,
    };
    refreshObjectPlatforms();
    platformsDirty = false;

    // As cores e o movimento vêm dos tokens e mudam com o tema.
    const tokens = window.getComputedStyle(document.documentElement);
    zColor =
      tokens.getPropertyValue("--sonho-z").trim() ||
      tokens.getPropertyValue("--ink").trim();
    laserColor =
      tokens.getPropertyValue("--sonho-laser").trim() ||
      tokens.getPropertyValue("--focinho").trim();
    worldColors = {
      yarn:
        tokens.getPropertyValue("--sonho-novelo").trim() ||
        tokens.getPropertyValue("--focinho").trim(),
      yarnLine:
        tokens.getPropertyValue("--sonho-novelo-linha").trim() ||
        tokens.getPropertyValue("--ink").trim(),
      box:
        tokens.getPropertyValue("--sonho-caixa").trim() ||
        tokens.getPropertyValue("--polpa").trim(),
      boxCrease:
        tokens.getPropertyValue("--sonho-caixa-vinco").trim() ||
        tokens.getPropertyValue("--ink-soft").trim(),
      boxInside:
        tokens.getPropertyValue("--sonho-caixa-dentro").trim() ||
        tokens.getPropertyValue("--ink").trim(),
      fish:
        tokens.getPropertyValue("--sonho-peixe").trim() ||
        tokens.getPropertyValue("--ceu").trim(),
      fishDark:
        tokens.getPropertyValue("--sonho-peixe-escuro").trim() ||
        tokens.getPropertyValue("--ink-soft").trim(),
      fishEye: tokens.getPropertyValue("--ink").trim(),
    };

    speechColors = {
      fill: tokens.getPropertyValue("--surface").trim(),
      ink: tokens.getPropertyValue("--ink").trim(),
      // A fonte do texto do site (a do <body>), com o tamanho do balão.
      font: `600 ${SPEECH_FONT_SIZE}px ${window.getComputedStyle(document.body).fontFamily}`,
    };

    const nextScarfLight =
      tokens.getPropertyValue("--sonho-lenco").trim() ||
      tokens.getPropertyValue("--focinho").trim();
    const nextScarfDark =
      tokens.getPropertyValue("--sonho-lenco-sombra").trim() ||
      tokens.getPropertyValue("--ink-soft").trim();
    if (nextScarfLight !== scarfLight || nextScarfDark !== scarfDark) {
      scarfLight = nextScarfLight;
      scarfDark = nextScarfDark;
      scarfSheet = null;
      scarfAttempted = false;
    }
    movementDuration = durationToken(
      tokens.getPropertyValue("--dur-movimento"),
      KNOCK_MOVEMENT_FALLBACK,
    );
    quickDuration = durationToken(
      tokens.getPropertyValue("--dur-rapida"),
      KNOCK_QUICK_FALLBACK,
    );
    exitCurve =
      tokens.getPropertyValue("--curva-saida").trim() ||
      KNOCK_EXIT_CURVE_FALLBACK;
    pounceCurve =
      tokens.getPropertyValue("--curva-bote").trim() ||
      KNOCK_POUNCE_CURVE_FALLBACK;
  }

  function createPageBox() {
    let lastPlatform: Platform | null = null;

    for (const platform of domPlatforms) {
      if (platform.right - platform.left < 120) continue;
      if (!lastPlatform || platform.top > lastPlatform.top) {
        lastPlatform = platform;
      }
    }

    if (lastPlatform) {
      objects.push(
        createBox(
          lastPlatform.right - BOX_WIDTH - 24,
          lastPlatform.top - BOX_HEIGHT - 4,
        ),
      );
    }

    createPageFish(lastPlatform);
    refreshObjectPlatforms();
  }

  /**
   * Um peixinho por página da coleção, sempre no mesmo lugar (pelo hash da
   * página, sem sorteio), fora da plataforma da caixa.
   */
  function createPageFish(boxPlatform: Platform | null) {
    activeFishKey = null;
    const key = fishKey(window.location.pathname);
    if (!key || collectedFish.has(key)) return;

    const candidates = domPlatforms.filter(
      (platform) =>
        platform.element &&
        platform.element !== boxPlatform?.element &&
        platform.right - platform.left >= 80,
    );
    const menu = domPlatforms.find(
      (platform) => platform.element?.dataset.plataforma === "base",
    );
    const choices = candidates.length > 0 ? candidates : menu ? [menu] : [];
    if (choices.length === 0) return;

    const chosen = choices[hashString(key) % choices.length];
    if (!chosen.element) return;

    const fraction = 0.2 + (hashString(`${key}x`) % 60) / 100;
    objects.push(createFish(chosen.element, fraction));
    activeFishKey = key;
  }

  /** Tira os peixes pegos do mundo e guarda a coleção. */
  function collectCaughtFish() {
    let caught = false;

    for (let index = objects.length - 1; index >= 0; index -= 1) {
      const object = objects[index];
      if (object.kind === "peixe" && object.collected?.()) {
        objects.splice(index, 1);
        caught = true;
      }
    }

    if (!caught || !activeFishKey) return;

    // Relê antes de gravar: outra aba pode ter pegado outro peixe.
    const latest = readCollected();
    latest.add(activeFishKey);
    saveCollected(latest);
    collectedFish = latest;
    activeFishKey = null;

    const nextPrize = collectedFish.size === FISH_PAGES.length;
    if (nextPrize && !hasPrize) {
      scarfSheet = null;
      scarfAttempted = false;
    }
    hasPrize = nextPrize;
    preparePrizeSprite();
    publishFish(true);
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

  function platformOwner(platform: Platform): PlatformOwner | null {
    return platform.object ?? platform.element;
  }

  function platformFor(current: Support) {
    if (current === null) return null;
    if (current === "ground") {
      return platforms.find((platform) => platform.ground) ?? null;
    }
    if (current instanceof HTMLElement) {
      return (
        platforms.find((platform) => platform.element === current) ?? null
      );
    }
    return platforms.find((platform) => platform.object === current) ?? null;
  }

  function overlaps(platform: Platform) {
    const left = x + BODY_LEFT;
    const right = x + BODY_RIGHT;

    // A caixa é menor que o gato: só conta como dentro com o meio do corpo
    // sobre o fundo, senão ele "entrava" com a beirada e ficava flutuando.
    if (platform.object) {
      const center = (left + right) / 2;
      return center >= platform.left && center <= platform.right;
    }

    return right > platform.left && left < platform.right;
  }

  function setSupport(platform: Platform) {
    support = platform.ground ? "ground" : platformOwner(platform);
    y = platform.top - CELL_H;
    velocityY = 0;
    landingAge = 0;
    idleTime = 0;
    laserJumpUsed = false;
  }

  function publishHint(next: string | null) {
    if (next === currentHint) return;
    currentHint = next;
    options.onHint(next);
  }

  function openTarget(): OpenTarget | null {
    if (!(support instanceof HTMLElement)) return null;

    const link = support.matches("a[href]")
      ? (support as HTMLAnchorElement)
      : support.querySelector<HTMLAnchorElement>("a[href]");

    if (!link) return null;

    const href = link.getAttribute("href")?.trim() ?? "";
    // Só páginas do site; âncoras (como a setinha "rolar" do hero) não contam.
    if (!href.startsWith("/") || href.startsWith("//") || href.includes("#")) {
      return null;
    }

    const heading = support.querySelector<HTMLElement>("h1, h2, h3");
    const name =
      shortText(heading?.textContent ?? link.textContent ?? "") || "link";

    return { href, name };
  }

  function updateHint() {
    const target = openTarget();
    publishHint(target ? `Enter: abrir ${target.name}` : null);
  }

  /**
   * Pisou num card com comentário: o Pequi fala uma vez, por alguns
   * segundos. Para falar de novo, precisa sair do card e voltar.
   */
  function updateSpeech(delta: number) {
    const source =
      support instanceof HTMLElement && support.dataset.pequiComenta?.trim()
        ? support
        : null;

    if (speech) {
      speech.age += delta;
      // Saiu do card: o balão some e o card pode falar de novo depois.
      if (source !== speech.source) {
        speech = null;
        options.onSpeech(null);
      }
      return;
    }

    if (!source) return;
    const text = source.dataset.pequiComenta?.trim() ?? "";
    speech = { text, source, age: 0 };
    options.onSpeech(text);
  }

  function wrapSpeech(text: string) {
    if (!context) return [text];

    const lines: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && context.measureText(next).width > SPEECH_MAX_WIDTH) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  /** Balão em pixel: retângulo com borda de 2 px e um rabinho em degraus. */
  function drawSpeech(screenX: number, screenY: number) {
    if (!context || !speech || speech.age >= SPEECH_TIME) return;

    context.save();
    context.font = speechColors.font;
    context.textBaseline = "top";

    const lines = wrapSpeech(speech.text);
    const textWidth = Math.max(...lines.map((line) => context.measureText(line).width));
    const width = Math.ceil(textWidth) + SPEECH_PADDING * 2 + SPEECH_BORDER * 2;
    const height = lines.length * SPEECH_LINE_HEIGHT + SPEECH_PADDING * 2 + SPEECH_BORDER * 2;

    const catCenter = screenX + (BODY_LEFT + BODY_RIGHT) / 2;
    const left = Math.round(
      Math.min(window.innerWidth - width - 8, Math.max(8, catCenter - width / 2)),
    );
    const top = Math.round(screenY - height - SPEECH_TAIL - 2);

    // Some de leve no último meio segundo (sem esmaecer com menos movimento).
    const remaining = SPEECH_TIME - speech.age;
    context.globalAlpha = reducedMotion ? 1 : Math.min(1, remaining / 0.5);

    context.fillStyle = speechColors.ink;
    context.fillRect(left, top, width, height);
    context.fillStyle = speechColors.fill;
    context.fillRect(
      left + SPEECH_BORDER,
      top + SPEECH_BORDER,
      width - SPEECH_BORDER * 2,
      height - SPEECH_BORDER * 2,
    );

    // O rabinho aponta para a cabeça do gato, preso dentro do balão.
    const tailX = Math.round(Math.min(left + width - 16, Math.max(left + 10, catCenter - 3)));
    for (let step = 0; step < SPEECH_TAIL / 2; step += 1) {
      const tailWidth = SPEECH_TAIL - step * 2;
      context.fillStyle = speechColors.ink;
      context.fillRect(tailX + step, top + height + step * 2, tailWidth + 2, 2);
      context.fillStyle = speechColors.fill;
      if (tailWidth > 2) context.fillRect(tailX + step + 2, top + height - 2 + step * 2, tailWidth - 2, 2);
    }

    context.fillStyle = speechColors.ink;
    lines.forEach((line, index) => {
      context.fillText(
        line,
        left + SPEECH_BORDER + SPEECH_PADDING,
        top + SPEECH_BORDER + SPEECH_PADDING + index * SPEECH_LINE_HEIGHT,
      );
    });

    context.restore();
  }

  function tryOpen() {
    const target = openTarget();
    if (target) options.onOpen(target.href);
  }

  function targetIsVisible(target: HTMLElement, rect: DOMRect) {
    if (
      rect.width <= 0 ||
      rect.height <= 0 ||
      target.getClientRects().length === 0
    ) {
      return false;
    }

    if (
      rect.right <= 0 ||
      rect.bottom <= 0 ||
      rect.left >= window.innerWidth ||
      rect.top >= window.innerHeight
    ) {
      return false;
    }

    const style = window.getComputedStyle(target);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  function durationToken(value: string, fallback: number) {
    const clean = value.trim().toLowerCase();
    if (!clean) return fallback;

    const parsed = Number.parseFloat(clean);
    if (!Number.isFinite(parsed)) return fallback;
    if (clean.endsWith("ms")) return parsed;
    if (clean.endsWith("s")) return parsed * 1_000;
    return parsed;
  }

  function pawReachBounds() {
    const bodyFront = facing > 0 ? x + BODY_RIGHT : x + BODY_LEFT;

    return {
      left: facing > 0 ? bodyFront : bodyFront - PAW_REACH,
      right: facing > 0 ? bodyFront + PAW_REACH : bodyFront,
      top: y + CELL_H / 2 - 10,
      bottom: y + CELL_H / 2 + 10,
    };
  }

  function hitWorldObject() {
    // Objetos rolam no chão: a pata desce até os pés e vai mais longe.
    const paw = pawReachBounds();
    const reach = {
      left: facing > 0 ? paw.left : paw.left - OBJECT_EXTRA_REACH,
      right: facing > 0 ? paw.right + OBJECT_EXTRA_REACH : paw.right,
      top: paw.top,
      bottom: y + CELL_H + 2,
    };

    for (const object of objects) {
      const bounds = object.bounds();
      const touched =
        bounds.right >= reach.left &&
        bounds.left <= reach.right &&
        bounds.bottom >= reach.top &&
        bounds.top <= reach.bottom;

      if (touched) {
        object.kick(facing);
        return true;
      }
    }

    return false;
  }

  function hitPawTarget() {
    const reach = pawReachBounds();
    const targets = document.querySelectorAll<HTMLElement>(
      "[data-pequi-patada]",
    );

    for (const target of targets) {
      const rect = target.getBoundingClientRect();
      if (!targetIsVisible(target, rect)) continue;

      const left = rect.left + window.scrollX;
      const right = rect.right + window.scrollX;
      const top = rect.top + window.scrollY;
      const bottom = rect.bottom + window.scrollY;
      const reached =
        right >= reach.left &&
        left <= reach.right &&
        bottom >= reach.top &&
        top <= reach.bottom;

      if (reached) {
        target.click();
        return true;
      }
    }

    return false;
  }

  function canKnockThing(element: Element) {
    // Em SVG o tagName vem em minúsculas.
    const tag = element.tagName.toUpperCase();
    if (element === canvas || KNOCK_IGNORED_TAGS.has(tag)) {
      return false;
    }

    if (element.closest('[aria-label^="Controles"]')) return false;
    if (element.closest("[data-pequi-patada]")) return false;
    if (!KNOCK_TAGS.has(tag)) return false;
    if (knockedThings.has(element)) return false;

    const style = window.getComputedStyle(element);
    if (style.display === "inline" || style.display === "contents") return false;

    const rect = element.getBoundingClientRect();
    return rect.width <= KNOCK_MAX_WIDTH && rect.height <= KNOCK_MAX_HEIGHT;
  }

  function knockThing() {
    if (!active) return;

    const bodyFront = facing > 0 ? x + BODY_RIGHT : x + BODY_LEFT;
    const pawX = bodyFront + (facing * PAW_REACH) / 2;
    const points = [
      { x: pawX, y: y + CELL_H / 2 },
      { x: pawX, y: y + CELL_H + 16 },
      { x: pawX, y: y + CELL_H + 40 },
    ];

    let target: Element | null = null;

    for (const point of points) {
      const screenX = point.x - window.scrollX;
      const screenY = point.y - window.scrollY;

      if (
        screenX < 0 ||
        screenY < 0 ||
        screenX >= window.innerWidth ||
        screenY >= window.innerHeight
      ) {
        continue;
      }

      for (const hit of document.elementsFromPoint(screenX, screenY)) {
        let candidate: Element | null = hit;

        while (candidate) {
          if (canKnockThing(candidate)) {
            target = candidate;
            break;
          }
          candidate = candidate.parentElement;
        }

        if (target) break;
      }

      if (target) break;
    }

    if (!target) return;

    const side = facing;
    const width = target.getBoundingClientRect().width;
    const tilt = Math.min(
      1,
      Math.max(0.2, KNOCK_FULL_TILT_WIDTH / Math.max(1, width)),
    );
    const transformOrigin = side > 0 ? "right bottom" : "left bottom";
    const keyframes: Keyframe[] = reducedMotion
      ? [
          { transform: "translateX(0px)", transformOrigin },
          { transform: `translateX(${3 * side}px)`, transformOrigin },
          { transform: `translateX(${-2 * side}px)`, transformOrigin },
          { transform: "translateX(0px)", transformOrigin },
        ]
      : [
          {
            transform: "none",
            transformOrigin,
            offset: 0,
            easing: exitCurve,
          },
          {
            transform: `translate(${6 * side}px, -5px) rotate(${9 * side * tilt}deg)`,
            transformOrigin,
            offset: 0.22,
            easing: exitCurve,
          },
          {
            transform: `translate(${10 * side}px, 3px) rotate(${15 * side * tilt}deg)`,
            transformOrigin,
            offset: 0.5,
            easing: "linear",
          },
          {
            transform: `translate(${10 * side}px, 3px) rotate(${15 * side * tilt}deg)`,
            transformOrigin,
            offset: 0.72,
            easing: pounceCurve,
          },
          {
            transform: "none",
            transformOrigin,
            offset: 1,
          },
        ];

    const movement = target.animate(keyframes, {
      duration: reducedMotion ? quickDuration * 2 : movementDuration * 3,
      fill: "none",
    });

    knockedThings.add(target);
    void movement.finished.then(
      () => {
        knockedThings.delete(target);
      },
      () => {
        knockedThings.delete(target);
      },
    );
  }

  function startPaw() {
    if (support === null || pawTime !== null) return;

    pawTime = 0;
    pawHit = false;
    velocityX = 0;
    idleTime = 0;
  }

  function releaseLaserJump() {
    if (laserJumpHeld && !isJumpHeld()) jumpCutRequested = true;
    laserJumpHeld = false;
  }

  function updateLaserTarget(event: PointerEvent) {
    laserTarget = {
      x: event.clientX + window.scrollX,
      y: event.clientY + window.scrollY,
    };
  }

  function enableLaserPointer() {
    canvas.style.pointerEvents = "auto";
    canvas.style.cursor = "none";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointermove", updateLaserTarget);
    canvas.addEventListener("pointerdown", updateLaserTarget);
  }

  function disableLaserPointer() {
    canvas.removeEventListener("pointermove", updateLaserTarget);
    canvas.removeEventListener("pointerdown", updateLaserTarget);
    canvas.style.pointerEvents = "";
    canvas.style.cursor = "";
    canvas.style.touchAction = "";
  }

  function setLaser(next: boolean) {
    if (!active || laserActive === next) return;

    laserActive = next;
    laserJumpUsed = false;
    laserLastPaw = null;

    if (next) {
      if (!laserTarget) {
        laserTarget = {
          x: x + (BODY_LEFT + BODY_RIGHT) / 2 + facing * LASER_INITIAL_DISTANCE,
          y: y + CELL_H,
        };
      }
      enableLaserPointer();
    } else {
      releaseLaserJump();
      disableLaserPointer();
    }

    options.onLaserChange(next);
  }

  function dropYarn() {
    if (!active) return;

    const desiredX = x + (BODY_LEFT + BODY_RIGHT) / 2 + facing * 120;
    const maximumX = Math.max(0, worldWidth - YARN_SIZE);
    const yarnX = Math.min(maximumX, Math.max(0, desiredX));
    // Cai do céu perto dele: soltar do alto da tela fazia o novelo parar no
    // menu, que é plataforma da largura toda.
    const yarnY = Math.max(window.scrollY - YARN_SIZE, y - 140);
    const yarn = objects.find((object) => object.kind === "novelo");

    if (yarn) {
      repositionWorldObject(yarn, yarnX, yarnY);
      return;
    }

    objects.push(createYarn(yarnX, yarnY));
  }

  function updateLaserPilot(
    currentPlatform: Platform | null,
    manualMovement: boolean,
  ): PilotInput {
    const idle: PilotInput = { axis: 0, jumping: false, down: false };

    if (!laserActive || !laserTarget || manualMovement) {
      releaseLaserJump();
      return idle;
    }

    const centerX = x + (BODY_LEFT + BODY_RIGHT) / 2;
    const feet = y + CELL_H;
    const dx = laserTarget.x - centerX;
    const dy = laserTarget.y - feet;
    const absoluteX = Math.abs(dx);
    const absoluteY = Math.abs(dy);

    let axis: -1 | 0 | 1 = 0;
    if (absoluteX > 10) axis = dx > 0 ? 1 : -1;
    else if (dx !== 0) facing = dx > 0 ? 1 : -1;

    const down = Boolean(
      currentPlatform &&
        !currentPlatform.ground &&
        dy > 48 &&
        absoluteX < 140,
    );

    let jumping = false;
    if (
      currentPlatform &&
      pawTime === null &&
      !laserJumpUsed &&
      dy < -28 &&
      absoluteX < 220
    ) {
      jumpBuffer = JUMP_BUFFER_TIME;
      laserJumpUsed = true;
      jumping = true;
    }

    if (!currentPlatform && velocityY < 0 && laserTarget.y < y + 10) {
      jumping = true;
    }

    if (laserJumpHeld && !jumping && !isJumpHeld()) jumpCutRequested = true;
    laserJumpHeld = jumping;

    if (
      currentPlatform &&
      pawTime === null &&
      absoluteX <= 14 &&
      absoluteY <= 24
    ) {
      const moved = laserLastPaw
        ? Math.hypot(
            laserTarget.x - laserLastPaw.x,
            laserTarget.y - laserLastPaw.y,
          ) > LASER_PAW_DISTANCE
        : true;
      const waited = laserLastPaw
        ? gameTime - laserLastPaw.time >= LASER_PAW_INTERVAL
        : true;

      if (moved || waited) {
        startPaw();
        laserLastPaw = {
          x: laserTarget.x,
          y: laserTarget.y,
          time: gameTime,
        };
      }
    }

    return { axis, jumping, down };
  }

  function clearInput() {
    pressed.clear();
    actions.clear();
    jumpBuffer = 0;
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

    if (event.code === "KeyL") {
      if (!event.repeat) setLaser(!laserActive);
      return;
    }

    if (event.code === "KeyN") {
      if (!event.repeat) dropYarn();
      return;
    }

    if (!CONTROL_CODES.has(event.code)) return;

    const wasPressed = pressed.has(event.code);
    pressed.add(event.code);

    if (JUMP_CODES.includes(event.code) && !wasPressed) {
      jumpBuffer = JUMP_BUFFER_TIME;
    }

    if (PAW_CODES.includes(event.code) && !wasPressed) startPaw();
    if (event.code === "Enter" && !wasPressed) tryOpen();
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

  function worldView(excludedObject?: WorldObject): WorldView {
    return {
      platforms: platforms.flatMap((platform) =>
        platform.object === excludedObject && excludedObject
          ? []
          : [{ ...platform, owner: platform.object ?? platform.element ?? "chao" }],
      ),
      worldWidth,
      gravity: GRAVITY,
      maxFallSpeed: MAX_FALL_SPEED,
      reducedMotion,
      cat: {
        left: x + BODY_LEFT,
        right: x + BODY_RIGHT,
        top: y,
        bottom: y + CELL_H,
        velocityX,
        facing,
        grounded: support !== null,
      },
    };
  }

  function updatePhysics(delta: number) {
    // Objetos podem oferecer plataformas novas sem reler o DOM inteiro.
    refreshObjectPlatforms();

    gameTime += delta;
    jumpBuffer = Math.max(0, jumpBuffer - delta);

    if (landingAge !== null) {
      landingAge += delta;
      if (landingAge >= 2 / animation("pulo").fps) landingAge = null;
    }

    let currentPlatform = platformFor(support);
    const feet = y + CELL_H;

    if (support !== null && !currentPlatform) support = null;

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

    if (pawTime !== null && !currentPlatform) {
      pawTime = null;
      pawHit = false;
    }

    const manualMovement = hasManualMovement();
    const pilot = updateLaserPilot(currentPlatform, manualMovement);

    if (jumpCutRequested) {
      if (velocityY < -JUMP_CUT_SPEED) velocityY = -JUMP_CUT_SPEED;
      jumpCutRequested = false;
    }

    const patting = pawTime !== null;
    const downHeld = manualMovement ? isDownHeld() : pilot.down;

    if (currentPlatform && !patting && downHeld && !currentPlatform.ground) {
      dropThrough = platformOwner(currentPlatform);
      support = null;
      currentPlatform = null;
      coyoteTime = 0;
      y += 2;
      velocityY = Math.max(velocityY, 80);
      idleTime = 0;
    }

    if (currentPlatform) coyoteTime = COYOTE_TIME;
    else coyoteTime = Math.max(0, coyoteTime - delta);

    const axis = patting
      ? 0
      : manualMovement
        ? inputAxis()
        : pilot.axis;

    if (patting) {
      velocityX = 0;
    } else if (axis !== 0) {
      facing = axis > 0 ? 1 : -1;
      const acceleration = currentPlatform
        ? GROUND_ACCELERATION
        : AIR_ACCELERATION;
      velocityX = approaches(
        velocityX,
        axis * WALK_SPEED,
        acceleration * delta,
      );
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

    if (!patting && jumpBuffer > 0 && coyoteTime > 0 && !downHeld) {
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
        const ignored = platforms.find(
          (platform) => platformOwner(platform) === dropThrough,
        );
        if (!ignored || nextFeet > ignored.top + 10) dropThrough = null;
      }

      let landing: Platform | null = null;
      if (velocityY >= 0) {
        for (const platform of platforms) {
          if (
            platformOwner(platform) === dropThrough ||
            !overlaps(platform)
          ) {
            continue;
          }
          // O chão segura sempre, mesmo que ele já esteja abaixo: a página
          // pode encolher (troca de página, conteúdo que some) e ele cairia
          // para sempre fora do mundo.
          const crossed = platform.ground || previousFeet <= platform.top + 0.5;
          if (crossed && nextFeet >= platform.top) {
            if (!landing || platform.top < landing.top) landing = platform;
          }
        }
      }

      if (landing) setSupport(landing);
      else y = nextY;
    }

    for (const object of objects) {
      object.update(delta, worldView(object));
    }
    collectCaughtFish();

    if (pawTime !== null) {
      pawTime += delta;
      const meta = animation("patada");
      const frame = Math.min(
        meta.quadros - 1,
        Math.floor(pawTime * meta.fps),
      );

      // Objetos fogem rolando: o chute sai já no começo da patada, senão o
      // novelo empurrado está longe quando a pata chega.
      if (!pawHit && hitWorldObject()) pawHit = true;

      if (!pawHit && frame >= PAW_HIT_FRAME) {
        pawHit = true;
        if (!hitPawTarget()) knockThing();
      }

      if (pawTime >= meta.quadros / meta.fps) {
        pawTime = null;
        pawHit = false;
      }
    }

    const laserPursuing =
      !manualMovement && (pilot.axis !== 0 || pilot.jumping || pilot.down);
    const resting = support !== null && axis === 0 && Math.abs(velocityX) < 1;
    const insideBox = platformFor(support)?.object?.kind === "caixa";

    if (patting || pawTime !== null || laserPursuing) {
      idleTime = 0;
    } else if (insideBox && !manualMovement) {
      // Pula o sentar, mas o tempo segue correndo: sem somar, a animação de
      // dormir ficava presa no primeiro quadro.
      idleTime = Math.max(idleTime + delta, SLEEP_AFTER);
    } else if (resting) {
      idleTime += delta;
    } else {
      idleTime = 0;
    }

    updateHint();
    updateSpeech(delta);
  }

  function visual(): Visual {
    if (support === null) {
      if (velocityY < -220) return { name: "pulo", frame: 1 };
      if (velocityY < 100) return { name: "pulo", frame: 2 };
      return { name: "pulo", frame: 3 };
    }

    if (pawTime !== null) {
      const meta = animation("patada");
      return {
        name: "patada",
        frame: Math.min(
          meta.quadros - 1,
          Math.floor(pawTime * meta.fps),
        ),
      };
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
          frame: Math.min(
            4,
            Math.floor(sleepingFor * animation("dormir").fps),
          ),
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
        frame: Math.min(
          meta.quadros - 1,
          Math.floor(sittingFor * meta.fps),
        ),
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
    else if (screenFeet > lowerEdge)
      target = feet - window.innerHeight * 0.58;
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

  function drawZ(left: number, top: number, size: number, alpha: number) {
    if (!context) return;

    context.globalAlpha = alpha;
    context.fillStyle = zColor;
    Z_GLYPH.forEach((row, rowIndex) => {
      for (let column = 0; column < row.length; column += 1) {
        if (row[column] === "1") {
          context.fillRect(
            Math.round(left + column * size),
            Math.round(top + rowIndex * size),
            size,
            size,
          );
        }
      }
    });
    context.globalAlpha = 1;
  }

  /** Os "z" sobem da cabeça do Pequi dormindo, crescem e somem. */
  function drawSleepZs(screenX: number, screenY: number) {
    const headX = screenX + (facing > 0 ? 58 : CELL_W - 68);
    const headY = screenY + 14;

    if (reducedMotion) {
      drawZ(headX + 6 * facing, headY - Z_RISE / 2, 2, 0.8);
      return;
    }

    for (let index = 0; index < Z_COUNT; index += 1) {
      const phase = (gameTime / Z_CYCLE + index / Z_COUNT) % 1;
      const size = phase < 0.5 ? 2 : 3;
      drawZ(
        headX + phase * 16 * facing,
        headY - phase * Z_RISE,
        size,
        Math.min(1, (1 - phase) * 1.6),
      );
    }
  }

  /** O halo pisca sem deslocar o alvo pintado na página. */
  function drawLaser() {
    if (!context || !laserTarget) return;

    const centerX = Math.round(laserTarget.x - window.scrollX);
    const centerY = Math.round(laserTarget.y - window.scrollY);
    const haloAlpha = reducedMotion
      ? 0.25
      : 0.25 +
        Math.sin((gameTime / LASER_HALO_CYCLE) * Math.PI * 2) * 0.1;

    context.fillStyle = laserColor;
    context.globalAlpha = haloAlpha;
    context.fillRect(
      centerX - LASER_HALO_SIZE / 2,
      centerY - LASER_HALO_SIZE / 2,
      LASER_HALO_SIZE,
      LASER_HALO_SIZE,
    );
    context.globalAlpha = 1;
    context.fillRect(
      centerX - LASER_DOT_SIZE / 2,
      centerY - LASER_DOT_SIZE / 2,
      LASER_DOT_SIZE,
      LASER_DOT_SIZE,
    );
  }

  function render() {
    if (!context) return;

    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.imageSmoothingEnabled = false;

    for (const object of objects) {
      object.render(context, window.scrollX, window.scrollY, worldColors);
    }

    // A física pode começar antes da imagem; só o desenho do gato espera.
    if (sprite.complete && sprite.naturalWidth > 0) {
      const current = visual();
      const meta = animation(current.name);
      const screenX = x - window.scrollX;
      const screenY = y - window.scrollY;
      const sourceX = current.frame * CELL_W;
      const sourceY = meta.linha * CELL_H;

      preparePrizeSprite();
      const sheet = scarfSheet ?? sprite;

      context.save();
      if (facing < 0) {
        context.translate(screenX + CELL_W, screenY);
        context.scale(-1, 1);
        context.drawImage(
          sheet,
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
          sheet,
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

      // Só depois de deitar de vez (os quadros da respiração).
      if (current.name === "dormir" && current.frame >= 4) {
        drawSleepZs(screenX, screenY);
      }
    }

    for (const object of objects) {
      object.renderFront?.(
        context,
        window.scrollX,
        window.scrollY,
        worldColors,
      );
    }

    drawSpeech(x - window.scrollX, y - window.scrollY);

    // A luz fica sobre o gato, como o cursor que ela substitui.
    if (laserActive && laserTarget) drawLaser();
  }

  function loop(time: number) {
    if (!active || paused) return;

    if (platformsDirty) readPlatforms();

    if (boxDueAt && time >= boxDueAt) {
      boxDueAt = 0;
      readPlatforms();
      createPageBox();
    }

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

  function resetState() {
    velocityX = 0;
    velocityY = 0;
    support = null;
    dropThrough = null;
    coyoteTime = 0;
    jumpBuffer = 0;
    jumpCutRequested = false;
    idleTime = 0;
    gameTime = 0;
    landingAge = null;
    pawTime = null;
    pawHit = false;
    laserJumpUsed = false;
    laserJumpHeld = false;
    laserLastPaw = null;
    clearInput();
    publishHint(null);
    if (speech) options.onSpeech(null);
    speech = null;
  }

  function respawn() {
    if (!active) return;

    objects.length = 0;
    activeFishKey = null;
    readPlatforms();
    resetState();
    boxDueAt = performance.now() + BOX_DELAY_MS;
    laserTarget = null;
    facing = 1;
    x = window.scrollX + window.innerWidth / 2 - CELL_W / 2;
    // Reaparece no topo da página, não da tela, e cai no menu, de onde desce
    // para o conteúdo (S/↓). Na troca de página a rolagem ainda pode ser a da
    // página anterior: contar com ela fazia ele nascer abaixo do menu e cair
    // pela página inteira. A câmera vai até ele.
    y = 8 - CELL_H;
  }

  function start(origem?: DreamOrigin | null) {
    if (started || !context) return;

    started = true;
    active = true;
    paused = document.hidden;
    exitRequested = false;

    resizeCanvas();
    readPlatforms();
    resetState();
    collectedFish = readCollected();
    hasPrize = collectedFish.size === FISH_PAGES.length;
    scarfSheet = null;
    scarfAttempted = false;
    publishFish(false);
    boxDueAt = performance.now() + BOX_DELAY_MS;
    facing = 1;

    if (origem) {
      const feetCenter = (BODY_LEFT + BODY_RIGHT) / 2;
      const minX = -BODY_LEFT;
      const maxX = Math.max(minX, worldWidth - BODY_RIGHT);
      x = Math.min(maxX, Math.max(minX, origem.x - feetCenter));
      y = origem.y - CELL_H;
    } else {
      x = window.scrollX + window.innerWidth / 2 - CELL_W / 2;
      y =
        window.scrollY +
        Math.max(CELL_H + 24, window.innerHeight * 0.28) -
        CELL_H;
    }

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

  function setAction(action: DreamAction, isPressed: boolean) {
    if (!active) return;

    const wasPressed = actions.has(action);

    if (isPressed) {
      actions.add(action);
      idleTime = 0;

      if (!wasPressed && action === "pular") jumpBuffer = JUMP_BUFFER_TIME;
      if (!wasPressed && action === "patada") startPaw();
      if (!wasPressed && action === "abrir") tryOpen();
      return;
    }

    actions.delete(action);
    if (action === "pular" && wasPressed && !isJumpHeld()) {
      jumpCutRequested = true;
    }
  }

  function stop() {
    if (!started) return;

    setLaser(false);
    laserTarget = null;
    objects.length = 0;
    activeFishKey = null;
    started = false;
    active = false;
    paused = false;
    window.cancelAnimationFrame(frameRequest);
    window.clearInterval(refreshTimer);
    clearInput();
    publishHint(null);
    if (speech) options.onSpeech(null);
    speech = null;

    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    motion.removeEventListener("change", onMotionChange);

    if (context) {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  return { start, stop, respawn, dropYarn, setAction, setLaser };
}
