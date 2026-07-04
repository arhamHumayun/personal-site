import * as THREE from "three";

export type DieType = "d20" | "d12" | "d10" | "d8" | "d6" | "d4";

export const LEFT_PANEL_DICE: DieType[] = ["d20", "d10", "d6"];
export const RIGHT_PANEL_DICE: DieType[] = ["d12", "d8", "d4"];

export const DIE_RADIUS = 0.88;
export const DIE_SPACING = 0.35;

function createD10Geometry(radius: number): THREE.BufferGeometry {
  const angleStep = (Math.PI * 2) / 5;
  const twist = Math.PI / 5;
  const pole = 0.95;
  const ring = 0.58;
  const belt = 0.06;

  const vertices: [number, number, number][] = [[0, pole, 0]];

  for (let i = 0; i < 5; i++) {
    const angle = i * angleStep;
    vertices.push([Math.cos(angle) * ring, belt, Math.sin(angle) * ring]);
  }

  for (let i = 0; i < 5; i++) {
    const angle = i * angleStep + twist;
    vertices.push([Math.cos(angle) * ring, -belt, Math.sin(angle) * ring]);
  }

  vertices.push([0, -pole, 0]);

  const indices: number[] = [];
  for (let i = 0; i < 5; i++) {
    const upperNext = 1 + ((i + 1) % 5);
    const lower = 6 + i;
    const lowerNext = 6 + ((i + 1) % 5);

    indices.push(0, upperNext, lowerNext, 0, lowerNext, lower);
    indices.push(11, lower, lowerNext, 11, lowerNext, upperNext);
  }

  return new THREE.PolyhedronGeometry(vertices.flat(), indices, radius, 0);
}

function buildDieGeometry(type: DieType, radius: number): THREE.BufferGeometry {
  switch (type) {
    case "d20":
      return new THREE.IcosahedronGeometry(radius, 0);
    case "d12":
      return new THREE.DodecahedronGeometry(radius, 0);
    case "d10":
      return createD10Geometry(radius);
    case "d8":
      return new THREE.OctahedronGeometry(radius, 0);
    case "d6": {
      const side = (radius * 2) / Math.sqrt(3);
      return new THREE.BoxGeometry(side, side, side);
    }
    case "d4":
      return new THREE.TetrahedronGeometry(radius, 0);
  }
}

const geometryCache = new Map<string, THREE.BufferGeometry>();

export function createDieGeometry(type: DieType, radius: number): THREE.BufferGeometry {
  const key = `${type}:${radius}`;
  let geometry = geometryCache.get(key);
  if (!geometry) {
    geometry = buildDieGeometry(type, radius);
    geometryCache.set(key, geometry);
  }
  return geometry;
}

export interface DiePlacement {
  x: number;
  y: number;
  type: DieType;
}

/** Three dice in a single column with equal gaps and margins. */
export function layoutDice(
  types: DieType[],
  radius = DIE_RADIUS,
  spacing = DIE_SPACING
): DiePlacement[] {
  const pitch = radius * 2 + spacing;
  const rows = types.length;

  return types.map((type, index) => ({
    type,
    x: 0,
    y: ((rows - 1) / 2 - index) * pitch,
  }));
}

export function getCameraDistance(
  fovDeg: number,
  aspect: number,
  diceCount = 3,
  radius = DIE_RADIUS,
  spacing = DIE_SPACING
): number {
  const pitch = radius * 2 + spacing;
  const groupW = radius * 2;
  const groupH = (diceCount - 1) * pitch + radius * 2;
  const width = groupW + spacing * 2;
  const height = groupH + spacing * 2;

  const fov = (fovDeg * Math.PI) / 180;
  const zForHeight = (height / 2) / Math.tan(fov / 2);
  const hFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
  const zForWidth = (width / 2) / Math.tan(hFov / 2);

  return Math.max(zForHeight, zForWidth) * 1.05;
}

const BASE_ROTATIONS = [
  { x: 0.007, y: 0.011, z: 0.004 },
  { x: 0.008, y: 0.01, z: 0.005 },
  { x: 0.007, y: 0.014, z: 0.003 },
];

export function createDieRotations(direction: 1 | -1) {
  return BASE_ROTATIONS.map((speed) => ({
    x: speed.x * direction,
    y: speed.y * direction,
    z: speed.z * direction,
  }));
}
