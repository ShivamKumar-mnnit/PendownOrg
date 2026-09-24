import { useEffect, useRef } from "react";
import * as THREE from "three";

const STAR_COUNT = 900;
const FIELD_HEIGHT = 26;
const FIELD_WIDTH = 34;
const FIELD_DEPTH = 30;

function makeGridTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(56, 189, 248, 1)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, size - 1);
  ctx.lineTo(size, size - 1);
  ctx.moveTo(size - 1, 0);
  ctx.lineTo(size - 1, size);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(22, 22);
  return texture;
}

function makeStars() {
  const positions = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * FIELD_WIDTH;
    positions[i * 3 + 1] = (Math.random() - 0.5) * FIELD_HEIGHT;
    positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD_DEPTH;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xdff4ff,
    size: 0.055,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });
  return new THREE.Points(geometry, material);
}

function makeWireShape(geometry, color, opacity = 0.55) {
  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.LineSegments(edges, material);
}

const SHAPE_LAYOUT = [
  { kind: "ico", pos: [-4.2, 1.6, -3], scale: 1.5, speed: [0.05, 0.08, 0], color: 0x38bdf8, bob: 0.4 },
  { kind: "ico", pos: [3.4, 2.4, -6], scale: 0.9, speed: [-0.06, 0.05, 0], color: 0x22d3ee, bob: 0.3 },
  { kind: "octa", pos: [-2.6, -0.4, -8], scale: 1.1, speed: [0.04, -0.07, 0], color: 0x67e8f9, bob: 0.5 },
  { kind: "torus", pos: [4.6, -0.8, -4], scale: 1, speed: [0.02, 0.09, 0], color: 0x0ea5e9, bob: 0.35 },
];

/**
 * WebGL hero backdrop — starfield + scrolling perspective grid floor +
 * floating wireframe polyhedra, all nudged by cursor position. Dynamically
 * imported (see HeroBackground.jsx) so three.js only ships to the homepage.
 * Skips the animation loop under prefers-reduced-motion, rendering one
 * static frame instead.
 */
export default function VortexBackground({ className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 1.6, 6.5);
    camera.lookAt(0, -0.9, -6);
    const baseQuaternion = camera.quaternion.clone();

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const stars = makeStars();
    scene.add(stars);

    const gridTexture = makeGridTexture();
    const grid = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshBasicMaterial({ map: gridTexture, transparent: true, opacity: 0.75 })
    );
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -1.3;
    scene.add(grid);

    const shapes = SHAPE_LAYOUT.map(({ kind, pos, scale, speed, color, bob }) => {
      const geometry =
        kind === "ico"
          ? new THREE.IcosahedronGeometry(1, 0)
          : kind === "octa"
            ? new THREE.OctahedronGeometry(1, 0)
            : new THREE.TorusGeometry(0.8, 0.22, 8, 24);
      const mesh = makeWireShape(geometry, color);
      mesh.position.set(...pos);
      mesh.scale.setScalar(scale);
      return { mesh, speed, bob, baseY: pos[1] };
    });
    shapes.forEach((s) => scene.add(s.mesh));

    function resize() {
      const { clientWidth: w, clientHeight: h } = container;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const mouse = { x: 0, y: 0 };
    const smoothed = { x: 0, y: 0 };
    function handlePointerMove(e) {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    }
    window.addEventListener("mousemove", handlePointerMove);

    let rafId;
    const starPositions = stars.geometry.attributes.position;
    const clock = new THREE.Clock();

    function renderFrame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // Continuous upward drift — stars wrap back to the bottom of the
      // field once they scroll past the top, giving an endless flow.
      for (let i = 0; i < STAR_COUNT; i++) {
        const idx = i * 3 + 1;
        let y = starPositions.array[idx] + dt * 0.6;
        if (y > FIELD_HEIGHT / 2) y -= FIELD_HEIGHT;
        starPositions.array[idx] = y;
      }
      starPositions.needsUpdate = true;

      gridTexture.offset.y -= dt * 0.12;

      shapes.forEach(({ mesh, speed, bob, baseY }) => {
        mesh.rotation.x += speed[0] * dt * 3;
        mesh.rotation.y += speed[1] * dt * 3;
        mesh.position.y = baseY + Math.sin(t * 0.6 + baseY) * bob * 0.3;
      });

      // Cursor parallax — smoothed camera tilt, eased toward the pointer.
      smoothed.x += (mouse.x - smoothed.x) * 0.04;
      smoothed.y += (mouse.y - smoothed.y) * 0.04;
      camera.quaternion.copy(baseQuaternion);
      camera.rotateY(-smoothed.x * 0.06);
      camera.rotateX(smoothed.y * 0.035);
      camera.position.x = smoothed.x * 0.5;
      camera.position.y = 1.6 + smoothed.y * 0.25;

      renderer.render(scene, camera);
      if (!reduceMotion) rafId = requestAnimationFrame(renderFrame);
    }

    renderFrame();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handlePointerMove);
      resizeObserver.disconnect();
      shapes.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      stars.geometry.dispose();
      stars.material.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
      gridTexture.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className={`h-full w-full ${className}`} />;
}
