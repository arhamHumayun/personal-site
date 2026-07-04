import * as THREE from "three";

export type DieType = "d20" | "d12" | "d10" | "d8" | "d6" | "d4";

/** Top-left to bottom-right in a 2×3 grid */
export const DICE_STACK: DieType[] = ["d20", "d12", "d10", "d8", "d6", "d4"];

export const DIE_RADIUS = 0.88;
export const DICE_GRID_COLUMNS = 2;

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

export function createDieGeometry(type: DieType, radius: number): THREE.BufferGeometry {
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
      // Match circumscribed sphere to other polyhedra
      const side = (radius * 2) / Math.sqrt(3);
      return new THREE.BoxGeometry(side, side, side);
    }
    case "d4":
      return new THREE.TetrahedronGeometry(radius, 0);
  }
}

export function layoutDiceColumn(
  types: DieType[],
  radius: number,
  gap = 0.08
): { x: number; y: number; type: DieType }[] {
  const pitch = radius * 2 + gap;
  const totalHeight = types.length * pitch - gap;

  return types.map((type, index) => ({
    x: 0,
    y: totalHeight / 2 - radius - index * pitch,
    type,
  }));
}

export function layoutDiceGrid(
  types: DieType[],
  radius: number,
  columns = DICE_GRID_COLUMNS,
  gap = 0.06
): { x: number; y: number; type: DieType }[] {
  const rows = Math.ceil(types.length / columns);
  const pitch = radius * 2 + gap;

  return types.map((type, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    return {
      x: (col - (columns - 1) / 2) * pitch,
      y: ((rows - 1) / 2 - row) * pitch,
      type,
    };
  });
}

export interface DieRotation {
  x: number;
  y: number;
  z: number;
}

export function createDieRotations(count: number, direction: 1 | -1): DieRotation[] {
  const base = [
    { x: 0.007, y: 0.011, z: 0.004 },
    { x: 0.006, y: 0.013, z: 0.003 },
    { x: 0.008, y: 0.01, z: 0.005 },
    { x: 0.005, y: 0.012, z: 0.004 },
    { x: 0.007, y: 0.014, z: 0.003 },
    { x: 0.006, y: 0.009, z: 0.006 },
  ];

  return Array.from({ length: count }, (_, index) => {
    const speed = base[index % base.length];
    return {
      x: speed.x * direction,
      y: speed.y * direction,
      z: speed.z * direction,
    };
  });
}
