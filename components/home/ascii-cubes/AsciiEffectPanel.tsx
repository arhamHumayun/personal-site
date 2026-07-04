"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js";
import type { DiceLayoutMode } from "./use-dice-layout";
import {
  createDieGeometry,
  createDieRotations,
  DICE_STACK,
  DIE_RADIUS,
  layoutDiceColumn,
  layoutDiceGrid,
} from "./dice-geometries";
import {
  computePanelMouseInfluence,
  type MouseTrackerState,
  type PanelSide,
} from "./use-mouse-tracker";

const ASCII_CHARSET = " .:-+*=%@#";

const CAMERA_Z: Record<DiceLayoutMode, number> = {
  column: 15.2,
  grid: 11,
};

interface AsciiEffectPanelProps {
  className?: string;
  colors: { foreground: string; cubeColor: number };
  layout: DiceLayoutMode;
  side: PanelSide;
  mouseRef: React.RefObject<MouseTrackerState>;
  reducedMotionRef: React.RefObject<boolean>;
  spinDirection?: 1 | -1;
  paused?: boolean;
}

function makeEffectTransparent(effectElement: HTMLElement) {
  effectElement.style.backgroundColor = "transparent";

  const table = effectElement.querySelector("table");
  const cell = effectElement.querySelector("td");

  if (table instanceof HTMLElement) {
    table.style.backgroundColor = "transparent";
  }
  if (cell instanceof HTMLElement) {
    cell.style.backgroundColor = "transparent";
  }
}

export function AsciiEffectPanel({
  className,
  colors,
  layout,
  side,
  mouseRef,
  reducedMotionRef,
  spinDirection = 1,
  paused = false,
}: AsciiEffectPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    if (width === 0 || height === 0) {
      width = 320;
      height = 480;
    }

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    const baseCameraZ = CAMERA_Z[layout];
    camera.position.z = baseCameraZ;

    const scene = new THREE.Scene();

    const light1 = new THREE.PointLight(0xffffff, 2.8, 0, 0);
    light1.position.set(3, 4, 5);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffffff, 1.2, 0, 0);
    light2.position.set(-3, -2, -3);
    scene.add(light2);

    const material = new THREE.MeshPhongMaterial({
      flatShading: true,
      color: colors.cubeColor,
    });

    const rotations = createDieRotations(DICE_STACK.length, spinDirection);
    const placements =
      layout === "grid"
        ? layoutDiceGrid(DICE_STACK, DIE_RADIUS)
        : layoutDiceColumn(DICE_STACK, DIE_RADIUS);
    const diceMeshes: THREE.Mesh[] = [];

    for (const [index, { x, y, type }] of placements.entries()) {
      const mesh = new THREE.Mesh(createDieGeometry(type, DIE_RADIUS), material);
      mesh.position.set(x, y, 0);
      mesh.userData.rotationSpeed = rotations[index];
      mesh.userData.basePosition = new THREE.Vector3(x, y, 0);
      diceMeshes.push(mesh);
      scene.add(mesh);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);

    const effect = new AsciiEffect(renderer, ASCII_CHARSET, {
      invert: true,
      resolution: 0.13,
      color: true,
      alpha: true,
    });
    effect.setSize(width, height);

    const effectElement = effect.domElement;
    effectElement.style.color = colors.foreground;
    effectElement.style.fontFamily = "var(--font-plex-mono), ui-monospace, monospace";
    effectElement.style.overflow = "hidden";
    effectElement.style.pointerEvents = "none";
    makeEffectTransparent(effectElement);

    const parallaxLayer = parallaxRef.current;
    if (!parallaxLayer) return;

    parallaxLayer.appendChild(effectElement);

    let animationId = 0;
    let smoothInfluence = 0;
    let smoothLx = 0;
    let smoothLy = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const mouse = mouseRef.current;
      const reducedMotion = reducedMotionRef.current ?? false;
      const panelRect = container.getBoundingClientRect();
      const { influence, lx, ly } = reducedMotion
        ? { influence: 0, lx: 0, ly: 0 }
        : computePanelMouseInfluence(side, mouse, panelRect);

      smoothInfluence += (influence - smoothInfluence) * 0.14;
      smoothLx += (lx - smoothLx) * 0.16;
      smoothLy += (ly - smoothLy) * 0.16;

      const targetCamX = smoothLx * 1.4 * smoothInfluence;
      const targetCamY = -smoothLy * 0.45 * smoothInfluence;
      const targetCamZ = baseCameraZ - smoothInfluence * 2;
      camera.position.x += (targetCamX - camera.position.x) * 0.12;
      camera.position.y += (targetCamY - camera.position.y) * 0.12;
      camera.position.z += (targetCamZ - camera.position.z) * 0.1;

      light1.position.x = 3 + smoothLx * 5.5 * smoothInfluence;
      light1.position.y = 4 - smoothLy * 4.5 * smoothInfluence;
      light2.position.x = -3 + smoothLx * 2.5 * smoothInfluence;
      light2.position.y = -2 - smoothLy * 2 * smoothInfluence;

      const panelShiftX = smoothLx * 12 * smoothInfluence;
      parallaxLayer.style.transform = `translateX(${panelShiftX}px)`;

      if (!pausedRef.current) {
        for (const mesh of diceMeshes) {
          const speed = mesh.userData.rotationSpeed as {
            x: number;
            y: number;
            z: number;
          };
          const base = mesh.userData.basePosition as THREE.Vector3;

          const dx = smoothLx * 3.5 - base.x * 0.4;
          const dy = smoothLy * 3.5 - base.y * 0.4;
          const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / 3.5);
          const boost = 1 + proximity * smoothInfluence * 3;

          mesh.rotation.x += speed.x * boost + dy * 0.009 * smoothInfluence;
          mesh.rotation.y += speed.y * boost + dx * 0.009 * smoothInfluence;
          mesh.rotation.z += speed.z * boost;

          const floatOffset = proximity * 0.35 * smoothInfluence;
          mesh.position.x = base.x + smoothLx * floatOffset;
          mesh.position.y = base.y + smoothLy * floatOffset;
          mesh.position.z = proximity * smoothInfluence * 0.2;
        }
      }

      effect.render(scene, camera);
      makeEffectTransparent(effectElement);
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      if (nextWidth === 0 || nextHeight === 0) return;

      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
      effect.setSize(nextWidth, nextHeight);
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      parallaxLayer.style.transform = "";
      parallaxLayer.removeChild(effectElement);
      renderer.dispose();
      material.dispose();
      for (const mesh of diceMeshes) {
        mesh.geometry.dispose();
      }
    };
  }, [
    colors.cubeColor,
    colors.foreground,
    layout,
    side,
    mouseRef,
    reducedMotionRef,
    spinDirection,
  ]);

  return (
    <div ref={containerRef} className={className} aria-hidden>
      <div ref={parallaxRef} className="h-full w-full" />
    </div>
  );
}
