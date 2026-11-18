import art from '../../assets/sage-performance.json';

export type SageClip = 'idle' | 'arrival' | 'acknowledge' | 'focus' | 'recover' | 'signature' | 'ready';
export type SagePart = keyof typeof art.parts;
export const SAGE_DURATION: Record<SageClip, number> = {
  idle: 8000, arrival: 1100, acknowledge: 650, focus: 650, recover: 450, signature: 2600, ready: 700,
};
export const SAGE_RIG = { width: 560, height: 1000, scale: .76 };
export const SAGE_PARTS = art.parts;
export const SAGE_HEAD_SOCKET = art.headSocket;
export const SAGE_PAINT_ORDER = ['coat', 'body', 'head', 'collar', 'arm', 'star'] as const;

function track(time: number, keys: readonly (readonly [number, number])[]) {
  'worklet';
  for (let i = 1; i < keys.length; i++) {
    if (time <= keys[i][0]) {
      const [a, from] = keys[i - 1], [b, to] = keys[i];
      const t = Math.max(0, Math.min(1, (time - a) / (b - a)));
      return from + (to - from) * t * t * (3 - 2 * t);
    }
  }
  return keys[keys.length - 1][1];
}

export function sagePose(clip: SageClip, elapsed: number) {
  'worklet';
  const t = Math.max(0, elapsed);
  let head: SagePart = 'neutral', hand: SagePart = 'open';
  let headTurn = 0, arm = 0, coat = 0, starScale = .29, constellation = 0, arc = 0;
  if (clip === 'idle') {
    const phase = t % 8000;
    head = phase >= 3100 && phase < 3250 ? 'blink' : phase >= 5500 && phase < 5900 ? 'glance' : 'neutral';
    coat = Math.sin(t / 8000 * Math.PI * 2) * .012;
    arm = track(phase, [[0, 0], [2000, -.025], [4400, 0], [6200, .012], [8000, 0]]);
  } else if (clip === 'arrival') {
    head = t < 300 ? 'focus' : t < 540 ? 'glance' : 'neutral';
    headTurn = track(t, [[0, .025], [400, 0], [1100, 0]]);
    arm = track(t, [[0, -.2], [450, -.06], [1100, 0]]);
    coat = track(t, [[0, .035], [550, -.012], [1100, 0]]);
  } else if (clip === 'acknowledge') {
    head = t < 65 ? 'neutral' : t < 145 ? 'blink' : t < 500 ? 'acknowledge' : 'neutral';
    headTurn = track(t, [[0, 0], [220, .028], [460, -.008], [650, 0]]);
    arm = track(t, [[0, 0], [250, -.055], [650, 0]]);
  } else if (clip === 'ready') {
    head = t < 90 ? 'neutral' : t < 190 ? 'blink' : 'ready';
    arm = track(t, [[0, 0], [700, -.42]]);
    hand = t >= 350 ? 'pinch' : 'open';
    starScale = track(t, [[0, .29], [700, .16]]);
    coat = track(t, [[0, 0], [380, .035], [700, .014]]);
  } else {
    const shot = clip === 'focus' ? Math.min(t, 650)
      : clip === 'recover' ? track(t, [[0, 650], [450, 0]]) : Math.min(t, 2600);
    head = shot < 160 ? 'neutral' : shot < 320 ? 'glance' : shot < 1780 ? 'focus'
      : shot < 2250 ? 'acknowledge' : shot < 2420 ? 'glance' : 'neutral';
    hand = shot < 650 ? 'open' : shot < 1100 ? 'pinch' : shot < 2080 ? 'release' : 'open';
    arm = track(shot, [[0, 0], [250, -.04], [650, -.32], [1000, -.32], [1250, -.12],
      [1600, .08], [2080, -.08], [2600, 0]]);
    headTurn = track(shot, [[0, 0], [650, .025], [1500, .025], [2000, -.015], [2600, 0]]);
    starScale = track(shot, [[0, .29], [650, .11], [1000, .11], [1350, .25], [1900, .25], [2600, .29]]);
    arc = track(shot, [[0, 0], [1100, 0], [1450, 1], [1800, 1], [2300, 0], [2600, 0]]);
    constellation = track(shot, [[0, 0], [1300, 0], [1500, 1], [1800, 1], [2200, 0], [2600, 0]]);
    coat = track(shot, [[0, 0], [1000, -.01], [1550, .045], [2150, -.018], [2600, 0]]);
  }
  const cos = Math.cos(arm), sin = Math.sin(arm);
  const x = 347 + (165 * cos + 148 * sin) * .76;
  const y = 374 + (165 * sin - 148 * cos) * .76;
  return {
    head, hand, headTurn, arm, coat, starScale, constellation,
    starX: x + arc * 36, starY: y - arc * 100,
    starTurn: arc * .8,
  };
}

export function sageLayer(layer: 'coat' | 'head' | 'body' | 'collar' | 'arm' | 'star', pose: ReturnType<typeof sagePose>) {
  'worklet';
  if (layer === 'coat') return { part: 'coat' as const, x: 324, y: 411, rotation: pose.coat, scale: .88 };
  if (layer === 'head') return { part: pose.head, ...SAGE_HEAD_SOCKET, rotation: pose.headTurn, scale: .76 };
  if (layer === 'arm') return { part: pose.hand, x: 347, y: 374, rotation: pose.arm, scale: .76 };
  if (layer === 'star') return { part: 'star' as const, x: pose.starX, y: pose.starY, rotation: pose.starTurn, scale: pose.starScale };
  if (layer === 'collar') return { part: 'collar' as const, x: 218, y: 177, rotation: 0, scale: .76 };
  return { part: 'body' as const, x: 218, y: 177, rotation: 0, scale: .76 };
}

export function sageStageLayout(width: number, height: number, artHeight: number) {
  'worklet';
  const scale = Math.min(artHeight / SAGE_RIG.height, width / SAGE_RIG.width);
  return { scale, left: (width - SAGE_RIG.width * scale) / 2, top: height - SAGE_RIG.height * scale };
}
