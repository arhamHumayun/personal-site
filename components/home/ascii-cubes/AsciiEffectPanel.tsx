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
const HOVER_RADIUS_PX_SQ = HOVER_RADIUS_PX * HOVER_RADIUS_PX;
const TRANSPARENT_STYLE_ID = "ascii-effect-transparent";

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

function ensureTransparentStyles() {
  if (document.getElementById(TRANSPARENT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = TRANSPARENT_STYLE_ID;
  style.textContent =
    ".ascii-effect-panel,.ascii-effect-panel table,.ascii-effect-panel td{background-color:transparent!important}";
  document.head.appendChild(style);
}

function readAsciiViewport(td: HTMLElement): AsciiViewport | null {
  const rect = td.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  return {
    left: rect.left,
    top: rect.top,
    mapWidth: Math.max(td.scrollWidth, rect.width),
    mapHeight: Math.max(td.scrollHeight, rect.height),
  };
}

function getHoverBoost(
  projectedX: number,
  projectedY: number,
  viewport: AsciiViewport,
  mouseX: number,
  mouseY: number
): number {
  const screenX = viewport.left + (projectedX * 0.5 + 0.5) * viewport.mapWidth;
  const screenY = viewport.top + (-projectedY * 0.5 + 0.5) * viewport.mapHeight;
  const dx = mouseX - screenX;
  const dy = mouseY - screenY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= HOVER_RADIUS_PX_SQ) return 1;
  return 1 + HOVER_BOOST * (1 - Math.sqrt(distSq) / HOVER_RADIUS_PX);
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
  const resumeRef = useRef<() => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) resumeRef.current();
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    ensureTransparentStyles();

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

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);

    const effect = new AsciiEffect(renderer, ASCII_CHARSET, {
      invert: true,
      resolution: 0.13,
      color: true,
      alpha: true,
    });

    const effectElement = effect.domElement;
    effectElement.className = "ascii-effect-panel";
    effectElement.style.color = colors.foreground;
    effectElement.style.fontFamily =
      "var(--font-plex-mono), ui-monospace, monospace";
    effectElement.style.overflow = "hidden";
    effectElement.style.pointerEvents = "none";
    container.appendChild(effectElement);

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);

    let width = 0;
    let height = 0;
    let animationId = 0;
    let mouseX = -1;
    let mouseY = -1;
    let hoverEnabled = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let tdElement: HTMLTableCellElement | null = null;
    let viewport: AsciiViewport | null = null;

    const worldPosition = new THREE.Vector3();
    const projected = new THREE.Vector3();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onReducedMotionChange = () => {
      hoverEnabled = !reducedMotion.matches;
    };
    reducedMotion.addEventListener("change", onReducedMotionChange);

    const invalidateViewport = () => {
      viewport = null;
    };

    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      invalidateViewport();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", invalidateViewport, { passive: true });

    function getViewport(): AsciiViewport | null {
      if (viewport) return viewport;

      if (!tdElement || !tdElement.isConnected) {
        const td = effectElement.querySelector("td");
        tdElement = td instanceof HTMLTableCellElement ? td : null;
      }
      if (!tdElement) return null;

      viewport = readAsciiViewport(tdElement);
      return viewport;
    }

    function resize(w: number, h: number) {
      width = w;
      height = h;
      camera.aspect = w / h;
      camera.position.z = getCameraDistance(CAMERA_FOV, w / h, diceTypes.length);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      effect.setSize(w, h);
      invalidateViewport();
    }

    function animate() {
      if (pausedRef.current) {
        animationId = 0;
        return;
      }

      animationId = requestAnimationFrame(animate);

      if (width === 0 || height === 0) return;

      const activeViewport = hoverEnabled ? getViewport() : null;

      for (const mesh of diceMeshes) {
        const speed = mesh.userData.rotationSpeed as {
          x: number;
          y: number;
          z: number;
        };
        let boost = 1;

        if (activeViewport) {
          mesh.getWorldPosition(worldPosition);
          projected.copy(worldPosition).project(camera);
          boost = getHoverBoost(
            projected.x,
            projected.y,
            activeViewport,
            mouseX,
            mouseY
          );
        }

        mesh.rotation.x += speed.x * boost;
        mesh.rotation.y += speed.y * boost;
        mesh.rotation.z += speed.z * boost;
      }

      effect.render(scene, camera);
    }

    resumeRef.current = () => {
      if (!pausedRef.current && animationId === 0) animate();
    };
    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      const { width: nextWidth, height: nextHeight } = entries[0].contentRect;
      if (nextWidth === 0 || nextHeight === 0) return;
      resize(nextWidth, nextHeight);
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      animationId = 0;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", invalidateViewport);
      reducedMotion.removeEventListener("change", onReducedMotionChange);
      resizeObserver.disconnect();
      container.removeChild(effectElement);
      renderer.dispose();
      material.dispose();
    };
  }, [colors.cubeColor, colors.foreground, diceTypes, spinDirection]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
