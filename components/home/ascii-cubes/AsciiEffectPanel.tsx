"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js";
import {
  createDieGeometry,
  createDieRotations,
  DIE_RADIUS,
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
  columns: 1 | 2;
  spinDirection?: 1 | -1;
  paused?: boolean;
}

function makeEffectTransparent(element: HTMLElement) {
  element.style.backgroundColor = "transparent";
  for (const node of element.querySelectorAll("table, td")) {
    if (node instanceof HTMLElement) {
      node.style.backgroundColor = "transparent";
    }
  }
}

function getHoverBoost(
  mesh: THREE.Mesh,
  camera: THREE.PerspectiveCamera,
  panelRect: DOMRect,
  mouseX: number,
  mouseY: number,
  projected: THREE.Vector3
): number {
  projected.copy(mesh.position).project(camera);

  const screenX =
    panelRect.left + (projected.x * 0.5 + 0.5) * panelRect.width;
  const screenY =
    panelRect.top + (-projected.y * 0.5 + 0.5) * panelRect.height;
  const dist = Math.hypot(mouseX - screenX, mouseY - screenY);

  if (dist >= HOVER_RADIUS_PX) return 1;
  return 1 + HOVER_BOOST * (1 - dist / HOVER_RADIUS_PX);
}

export function AsciiEffectPanel({
  className,
  colors,
  columns,
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

    let width = container.clientWidth || 320;
    let height = container.clientHeight || 480;

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, 0.1, 100);
    camera.position.z = getCameraDistance(CAMERA_FOV, width / height, columns);

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

    for (const [index, { x, y, type }] of layoutDice(columns).entries()) {
      const mesh = new THREE.Mesh(createDieGeometry(type, DIE_RADIUS), material);
      mesh.position.set(x, y, 0);
      mesh.userData.rotationSpeed = rotations[index];
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
    container.appendChild(effectElement);

    let mouseX = -1;
    let mouseY = -1;
    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const projected = new THREE.Vector3();
    let animationId = 0;

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!pausedRef.current) {
        const panelRect = container.getBoundingClientRect();
        const hoverEnabled =
          !reducedMotion.matches &&
          mouseX >= panelRect.left &&
          mouseX <= panelRect.right &&
          mouseY >= panelRect.top &&
          mouseY <= panelRect.bottom;

        for (const mesh of diceMeshes) {
          const speed = mesh.userData.rotationSpeed as {
            x: number;
            y: number;
            z: number;
          };
          const boost = hoverEnabled
            ? getHoverBoost(mesh, camera, panelRect, mouseX, mouseY, projected)
            : 1;

          mesh.rotation.x += speed.x * boost;
          mesh.rotation.y += speed.y * boost;
          mesh.rotation.z += speed.z * boost;
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

      width = nextWidth;
      height = nextHeight;
      camera.aspect = width / height;
      camera.position.z = getCameraDistance(CAMERA_FOV, width / height, columns);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      effect.setSize(width, height);
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
  }, [colors.cubeColor, colors.foreground, columns, spinDirection]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
