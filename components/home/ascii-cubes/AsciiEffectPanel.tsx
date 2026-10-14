"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
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
const ASCII_RESOLUTION = 0.13;
const MAX_DPR = 2;
// Rotation speeds are tuned per frame at 60fps; scale by elapsed time instead
const BASE_FRAME_MS = 1000 / 60;
const MAX_FRAME_SCALE = 3;
// Per-frame (at 60fps) damping for released spin
const SPIN_DAMPING = 0.96;
const DRAG_SPIN_SMOOTHING = 0.5;

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

function readAsciiViewport(el: HTMLElement): AsciiViewport | null {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  return {
    left: rect.left,
    top: rect.top,
    mapWidth: rect.width,
    mapHeight: rect.height,
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
      mesh.userData.spin = new THREE.Vector3();
      diceMeshes.push(mesh);
      scene.add(mesh);
    }

    // The scene is rendered at ASCII-grid resolution (a few thousand pixels),
    // read back once, and drawn as glyphs onto a single 2D canvas.
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    const gl = renderer.getContext();
    const canvas = document.createElement("canvas");
    canvas.className = "ascii-effect-panel";
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontFamily =
      getComputedStyle(container).getPropertyValue("--font-plex-mono").trim() ||
      "ui-monospace, monospace";
    const glyphColor = `#${colors.cubeColor.toString(16).padStart(6, "0")}`;
    const maxCharIdx = ASCII_CHARSET.length - 1;

    let gridW = 0;
    let gridH = 0;
    let pixels = new Uint8Array(0);

    function drawAscii() {
      if (!ctx || gridW === 0) return;

      gl.readPixels(0, 0, gridW, gridH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = glyphColor;

      const cellW = width / gridW;
      const cellH = (height / gridH) * 2;

      for (let row = 0; row < gridH; row += 2) {
        // readPixels rows are bottom-up
        const srcRow = gridH - 1 - row;
        const y = (row / 2 + 0.5) * cellH;
        for (let x = 0; x < gridW; x++) {
          const i = (srcRow * gridW + x) * 4;
          if (pixels[i + 3] === 0) continue;

          const brightness =
            (0.3 * pixels[i] + 0.59 * pixels[i + 1] + 0.11 * pixels[i + 2]) / 255;
          const charIdx = Math.round(brightness * maxCharIdx);
          if (charIdx === 0) continue;

          ctx.fillText(ASCII_CHARSET[charIdx], (x + 0.5) * cellW, y);
        }
      }
    }

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);

    let width = 0;
    let height = 0;
    let animationId = 0;
    let lastFrameTime = 0;
    let mouseX = -1;
    let mouseY = -1;
    let hoverEnabled = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

      viewport = readAsciiViewport(canvas);
      return viewport;
    }

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planePoint = new THREE.Vector3();
    let grabbed: THREE.Mesh | null = null;
    let grabbedPointerId = -1;
    const dragPoint = new THREE.Vector2();
    const lastDragPoint = new THREE.Vector2();

    function pointerToPlane(event: PointerEvent, out: THREE.Vector3): boolean {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      pointerNdc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointerNdc, camera);
      return raycaster.ray.intersectPlane(dragPlane, out) !== null;
    }

    function pickDie(event: PointerEvent): THREE.Mesh | null {
      if (!pointerToPlane(event, planePoint)) return null;
      const hit = raycaster.intersectObjects(diceMeshes, false)[0];
      return hit ? (hit.object as THREE.Mesh) : null;
    }

    const onCanvasPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const die = pickDie(event);
      if (!die) return;

      grabbed = die;
      grabbedPointerId = event.pointerId;
      dragPoint.set(planePoint.x, planePoint.y);
      lastDragPoint.copy(dragPoint);
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      event.preventDefault();
    };

    const onCanvasPointerMove = (event: PointerEvent) => {
      if (grabbed && event.pointerId === grabbedPointerId) {
        if (pointerToPlane(event, planePoint)) {
          dragPoint.set(planePoint.x, planePoint.y);
        }
        return;
      }
      canvas.style.cursor = pickDie(event) ? "grab" : "";
    };

    const onCanvasPointerEnd = (event: PointerEvent) => {
      if (!grabbed || event.pointerId !== grabbedPointerId) return;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      grabbed = null;
      grabbedPointerId = -1;
      canvas.style.cursor = pickDie(event) ? "grab" : "";
    };

    canvas.addEventListener("pointerdown", onCanvasPointerDown);
    canvas.addEventListener("pointermove", onCanvasPointerMove);
    canvas.addEventListener("pointerup", onCanvasPointerEnd);
    canvas.addEventListener("pointercancel", onCanvasPointerEnd);

    function resize(w: number, h: number) {
      width = w;
      height = h;
      camera.aspect = w / h;
      camera.position.z = getCameraDistance(CAMERA_FOV, w / h, diceTypes.length);
      camera.updateProjectionMatrix();
      // hover projection runs before the first render() refreshes this
      camera.updateMatrixWorld();

      gridW = Math.max(1, Math.floor(w * ASCII_RESOLUTION));
      gridH = Math.max(2, Math.floor(h * ASCII_RESOLUTION));
      pixels = new Uint8Array(gridW * gridH * 4);
      renderer.setSize(gridW, gridH, false);

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.font = `${(h / gridH) * 2}px ${fontFamily}`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      invalidateViewport();
    }

    function animate(now: number = performance.now()) {
      if (pausedRef.current) {
        animationId = 0;
        lastFrameTime = 0;
        return;
      }

      animationId = requestAnimationFrame(animate);

      const frameScale = lastFrameTime
        ? Math.min((now - lastFrameTime) / BASE_FRAME_MS, MAX_FRAME_SCALE)
        : 1;
      lastFrameTime = now;

      if (width === 0 || height === 0) return;

      const activeViewport = hoverEnabled ? getViewport() : null;

      for (const mesh of diceMeshes) {
        const speed = mesh.userData.rotationSpeed as {
          x: number;
          y: number;
          z: number;
        };
        const spin = mesh.userData.spin as THREE.Vector3;

        if (mesh === grabbed) {
          // roll the die as if dragging a ball across a surface; it stays put
          const dx = dragPoint.x - lastDragPoint.x;
          const dy = dragPoint.y - lastDragPoint.y;
          lastDragPoint.copy(dragPoint);

          const perFrame = 1 / frameScale;
          spin.x += (-dy / DIE_RADIUS * perFrame - spin.x) * DRAG_SPIN_SMOOTHING;
          spin.y += (dx / DIE_RADIUS * perFrame - spin.y) * DRAG_SPIN_SMOOTHING;
          spin.z *= Math.pow(SPIN_DAMPING, frameScale);

          mesh.rotation.x += spin.x * frameScale;
          mesh.rotation.y += spin.y * frameScale;
          mesh.rotation.z += spin.z * frameScale;
          continue;
        }

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

        spin.multiplyScalar(Math.pow(SPIN_DAMPING, frameScale));
        const step = boost * frameScale;
        mesh.rotation.x += speed.x * step + spin.x * frameScale;
        mesh.rotation.y += speed.y * step + spin.y * frameScale;
        mesh.rotation.z += speed.z * step + spin.z * frameScale;
      }

      renderer.render(scene, camera);
      drawAscii();
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
      canvas.removeEventListener("pointerdown", onCanvasPointerDown);
      canvas.removeEventListener("pointermove", onCanvasPointerMove);
      canvas.removeEventListener("pointerup", onCanvasPointerEnd);
      canvas.removeEventListener("pointercancel", onCanvasPointerEnd);
      reducedMotion.removeEventListener("change", onReducedMotionChange);
      resizeObserver.disconnect();
      container.removeChild(canvas);
      renderer.dispose();
      material.dispose();
    };
  }, [colors.cubeColor, colors.foreground, diceTypes, spinDirection]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
