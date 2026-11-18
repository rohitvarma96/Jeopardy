export const AMBIENT_PERIOD_MS = 24000;
export type AtmosphereKind = 'arena' | 'battle';

export function atmosphereFrame(time: number, width: number, height: number, kind: AtmosphereKind) {
  'worklet';
  const phase = time / AMBIENT_PERIOD_MS * Math.PI * 2;
  const quiet = kind === 'battle';
  return {
    light: (quiet ? .025 : .045) + (1 - Math.cos(phase * 2)) * (quiet ? .018 : .03),
    rearX: width * (.5 + Math.sin(phase * 2) * .075),
    rearY: height * (.43 + Math.sin(phase * 3) * .018),
    floorX: width * (.48 + Math.sin(phase * 3) * .09),
    floorY: height * (.82 + Math.sin(phase * 2) * .012),
  };
}

export function atmosphereMote(time: number, index: number, width: number, height: number) {
  'worklet';
  const phase = time / AMBIENT_PERIOD_MS * Math.PI * 2;
  return {
    x: width * (.1 + ((index * 37 + 13) % 79) / 100 + Math.sin(phase + index) * .018),
    y: height * (.22 + (index % 5) * .11 + Math.sin(phase * 2 + index * 1.7) * .025),
    opacity: .07 + (1 - Math.cos(phase * 2 + index)) * .055,
  };
}
