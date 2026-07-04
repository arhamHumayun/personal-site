"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js";
import {
  createDieGeometry,
  createDieRotations,
  DIE_RADIUS,
  type DieType,
  getCameraDistance,
  layoutDice,
} from "./dice-geometries";

const ASCII_CHARSET = " .:-+*=%@#";
const CAMERA_FOV = 38;
const HOVER_RADIUS_PX = 72;
const HOVER_BOOST = 15;

interface AsciiEffectPanelProps {
  className?: string;
  colors: { foreground: string; cubeColor: number };
  diceTypes: DieType[];
  spinDirection?: 1 | -1;
  paused?: boolean;
}

interface AsciiViewport {
  left: number;
  top: number;
  mapWidth: number;
  mapHeight: number;
}

function makeEffectTransparent(element: HTMLElement) {
  element.style.backgroundColor = "transparent";
  for (const node of element.querySelectorAll("table, td")) {
    if (node instanceof HTMLElement) {
      node.style.backgroundColor = "transparent";
    }
  }
}

/**
 * AsciiEffect draws into a fixed-size td. The character grid can be wider/taller
 * than the clip box, so map against scroll dimensions for accurate hit testing.
 */
function getAsciiViewport(effectRoot: HTMLElement): AsciiViewport | null {
  const td = effectRoot.querySelector("td");
  if (!(td instanceof HTMLElement)) return null;

  const rect = td.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  return {
    left: rect.left,
    top: rect.top,
    mapWidth: Math.max(td.scrollWidth, rect.width),
    mapHeight: Math.max(td.scrollHeight, rect.height),
  };
}

function meshToScreen(
  mesh: THREE.Mesh,
  camera: THREE.PerspectiveCamera,
  viewport: AsciiViewport,
  worldPosition: THREE.Vector3,
  projected: THREE.Vector3
) {
  mesh.getWorldPosition(worldPosition);
  projected.copy(worldPosition).project(camera);

  return {
    x: viewport.left + (projected.x * 0.5 + 0.5) * viewport.mapWidth,
    y: viewport.top + (-projected.y * 0.5 + 0.5) * viewport.mapHeight,
  };
}

function getHoverBoost(
  mesh: THREE.Mesh,
  camera: THREE.PerspectiveCamera,
  viewport: AsciiViewport,
  mouseX: number,
  mouseY: number,
  worldPosition: THREE.Vector3,
  projected: THREE.Vector3
): number {
  const { x, y } = meshToScreen(
    mesh,
    camera,
    viewport,
    worldPosition,
    projected
  );
  const dist = Math.hypot(mouseX - x, mouseY - y);

  if (dist >= HOVER_RADIUS_PX) return 1;
  return 1 + HOVER_BOOST * (1 - dist / HOVER_RADIUS_PX);
}

export function AsciiEffectPanel({
  className,
  colors,
  diceTypes,
  spinDirection = 1,
  paused = false,
}: AsciiEffectPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    const rotations = createDieRotations(spinDirection);
    const diceMeshes: THREE.Mesh[] = [];

    for (const [index, { x, y, type }] of layoutDice(diceTypes).entries()) {
      const mesh = new THREE.Mesh(createDieGeometry(type, DIE_RADIUS), material);
      mesh.position.set(x, y, 0);
      mesh.userData.rotationSpeed = rotations[index];
      diceMeshes.push(mesh);
      scene.add(mesh);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);

    const effect = new AsciiEffect(renderer, ASCII_CHARSET, {
      invert: true,
      resolution: 0.13,
      color: true,
      alpha: true,
    });

    const effectElement = effect.domElement;
    effectElement.style.color = colors.foreground;
    effectElement.style.fontFamily =
      "var(--font-plex-mono), ui-monospace, monospace";
    effectElement.style.overflow = "hidden";
    effectElement.style.pointerEvents = "none";
    makeEffectTransparent(effectElement);
    container.appendChild(effectElement);

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);

    let width = 0;
    let height = 0;
    let animationId = 0;
    let mouseX = -1;
    let mouseY = -1;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const worldPosition = new THREE.Vector3();
    const projected = new THREE.Vector3();

    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    function resize(w: number, h: number) {
      width = w;
      height = h;
      camera.aspect = w / h;
      camera.position.z = getCameraDistance(CAMERA_FOV, w / h, diceTypes.length);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      effect.setSize(w, h);
    }

    function animate() {
      animationId = requestAnimationFrame(animate);

      if (width === 0 || height === 0) return;

      if (!pausedRef.current) {
        const viewport = getAsciiViewport(effectElement);

        for (const mesh of diceMeshes) {
          const speed = mesh.userData.rotationSpeed as {
            x: number;
            y: number;
            z: number;
          };
          const boost =
            viewport && !reducedMotion.matches
              ? getHoverBoost(
                  mesh,
                  camera,
                  viewport,
                  mouseX,
                  mouseY,
                  worldPosition,
                  projected
                )
              : 1;

          mesh.rotation.x += speed.x * boost;
          mesh.rotation.y += speed.y * boost;
          mesh.rotation.z += speed.z * boost;
        }
      }

      effect.render(scene, camera);
      makeEffectTransparent(effectElement);
    }

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      const { width: nextWidth, height: nextHeight } = entries[0].contentRect;
      if (nextWidth === 0 || nextHeight === 0) return;
      resize(nextWidth, nextHeight);
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("pointermove", onPointerMove);
      resizeObserver.disconnect();
      container.removeChild(effectElement);
      renderer.dispose();
      material.dispose();
      for (const mesh of diceMeshes) {
        mesh.geometry.dispose();
      }
    };
  }, [colors.cubeColor, colors.foreground, diceTypes, spinDirection]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
