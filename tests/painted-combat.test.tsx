import { afterEach, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { humanFighters } from '../src/assets/human-fighters';
import { HumanCombatArt } from '../src/components/fighters/HumanCombatArt';
import { actionContact, actionDuration, COMBAT_ACTIONS } from '../src/components/fighters/combat/actions';
import { sampleHumanPose } from '../src/components/fighters/combat/human-rig';
import { createPaintedMesh, deformPaintedMesh } from '../src/components/fighters/combat/painted-mesh';
import { FIGHTERS } from '../src/data/fighters';
import type { FighterId } from '../src/game/types/fighter';

afterEach(() => { jest.restoreAllMocks(); });

function PaintedFixture({ fighterId }: { fighterId: FighterId }) {
  const pose = useDerivedValue(() => sampleHumanPose('idle', 0, 3000, 0));
  return <HumanCombatArt fighterId={fighterId} pose={pose} />;
}

test.each(FIGHTERS)('$name uses the exact selection painting as its combat source', async (fighter) => {
  const module = jest.requireMock<typeof import('@shopify/react-native-skia')>('@shopify/react-native-skia');
  const useImage = jest.spyOn(module, 'useImage');
  await render(<PaintedFixture fighterId={fighter.id} />);
  expect(useImage.mock.calls[0][0]).toBe(humanFighters[fighter.id].source);
});

test.each(FIGHTERS)('$name rest mesh preserves every original texture coordinate without distortion', (fighter) => {
  const art = humanFighters[fighter.id];
  const mesh = createPaintedMesh(fighter.id, art.width, art.height);
  const vertices = deformPaintedMesh(mesh, mesh.rest);
  expect(mesh.textures).toHaveLength(mesh.bind.length);
  expect(mesh.weights.every((weights) => Math.abs(weights.reduce((sum, weight) => sum + weight.amount, 0) - 1) < 1e-10)).toBe(true);
  for (let index = 0; index < vertices.length; index++) {
    expect(vertices[index].x).toBeCloseTo(mesh.bind[index].x, 6);
    expect(vertices[index].y).toBeCloseTo(mesh.bind[index].y, 6);
    expect(mesh.textures[index].x).toBeGreaterThanOrEqual(0);
    expect(mesh.textures[index].x).toBeLessThanOrEqual(art.width);
    expect(mesh.textures[index].y).toBeGreaterThanOrEqual(0);
    expect(mesh.textures[index].y).toBeLessThanOrEqual(art.height);
  }
  expect(mesh.indices.every((index) => index >= 0 && index < mesh.bind.length)).toBe(true);
});

test.each(FIGHTERS)('$name articulated painting stays finite for every action and retains a held KO', (fighter) => {
  const art = humanFighters[fighter.id], mesh = createPaintedMesh(fighter.id, art.width, art.height);
  for (const action of COMBAT_ACTIONS) {
    const duration = actionDuration(action), contact = actionContact(fighter.id, action);
    for (const phase of [0, .3, .5, 1, 2]) {
      const vertices = deformPaintedMesh(mesh, sampleHumanPose(action, duration * phase, duration, contact, 96));
      expect(vertices.every((vertex) => Number.isFinite(vertex.x) && Number.isFinite(vertex.y))).toBe(true);
    }
  }
  const fall = deformPaintedMesh(mesh, sampleHumanPose('fall', 800, 800, 0));
  expect(fall).toEqual(deformPaintedMesh(mesh, sampleHumanPose('fall', 1600, 800, 0)));
  expect(Math.max(...fall.map((point) => point.y))).toBeLessThanOrEqual(538.001);
});

test('punch and kick change different painted limbs rather than moving one rigid PNG', () => {
  const art = humanFighters.ember, mesh = createPaintedMesh('ember', art.width, art.height);
  const idle = deformPaintedMesh(mesh, mesh.rest);
  const punch = deformPaintedMesh(mesh, sampleHumanPose('attack', 245, 680, 245, 96));
  const kick = deformPaintedMesh(mesh, sampleHumanPose('special', 380, 880, 380, 96));
  const upper = mesh.textures.findIndex((point) => point.x > art.width * .7 && point.y > art.height * .25 && point.y < art.height * .3);
  const leg = mesh.textures.findIndex((point) => point.x > art.width * .6 && point.y > art.height * .8);
  expect(Math.hypot(punch[upper].x - idle[upper].x, punch[upper].y - idle[upper].y)).toBeGreaterThan(10);
  expect(Math.hypot(kick[leg].x - idle[leg].x, kick[leg].y - idle[leg].y)).toBeGreaterThan(60);
  expect(punch).not.toEqual(kick);
});

test('face vertices retain their painted proportions during articulated motion', () => {
  const art = humanFighters.shadow, mesh = createPaintedMesh('shadow', art.width, art.height);
  const vertices = deformPaintedMesh(mesh, sampleHumanPose('attack', 245, 680, 245, 96));
  const face = mesh.weights.map((weights, index) => weights.length === 1 && weights[0].bone === 1 ? index : -1).filter((index) => index >= 0);
  const first = face[0], last = face[face.length - 1];
  const before = Math.hypot(mesh.bind[first].x - mesh.bind[last].x, mesh.bind[first].y - mesh.bind[last].y);
  const after = Math.hypot(vertices[first].x - vertices[last].x, vertices[first].y - vertices[last].y);
  expect(after).toBeCloseTo(before, 6);
});
