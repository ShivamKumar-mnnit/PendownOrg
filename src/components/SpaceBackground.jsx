import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeStars, makeWireShape, makeGlowSprite, makeAtomCluster, createPointerParallax } from "../lib/threeFx";

const STAR_COUNT = 500;
const FIELD = { w: 30, h: 24, d: 22 };

const WIRE_SHAPES = [
  { kind: "ico", pos: [-5.5, 3, -6], scale: 1.1, color: 0x38bdf8 },
  { kind: "octa", pos: [5.8, -2.8, -8], scale: 0.9, color: 0x67e8f9 },
];

const MINI_PLANETS = [
  { pos: [6, 3.4, -5], radius: 0.28, color: 0x991b1b, glow: "rgba(239,68,68,0.5)" },
  { pos: [-6.2, -3, -6], radius: 0.24, color: 0x52525b, glow: "rgba(148,163,184,0.3)" },
];

const ATOM_CLUSTERS = [
  { pos: [-4.5, -2.2, -4], color: 0xbfe3ff, scale: 1 },
  { pos: [5.2, 2.4, -6], color: 0x99f6e4, scale: 0.85 },
];

/**
 * Fixed, viewport-covering WebGL backdrop mounted once in Layout — the
 * persistent "whole site" space scene: drifting starfield, a couple of
 * wireframe shapes, small accent planets, and atom clusters. Page content
 * scrolls independently over it (`position: fixed`), so this never remounts
 * or re-inits its WebGL context on route changes. The Hero and Why Anobyt
 * sections paint their own opaque/local scenes on top of this one.
 */
export default function SpaceBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, -4);
    const baseQuaternion = camera.quaternion.clone();

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const stars = makeStars(STAR_COUNT, FIELD);
    scene.add(stars);

    const shapes = WIRE_SHAPES.map(({ kind, pos, scale, color }) => {
      const geometry = kind === "ico" ? new THREE.IcosahedronGeometry(1, 0) : new THREE.OctahedronGeometry(1, 0);
      const mesh = makeWireShape(geometry, color, 0.35);
      mesh.position.set(...pos);
      mesh.scale.setScalar(scale);
      return mesh;
    });
    shapes.forEach((m) => scene.add(m));

    const miniPlanets = MINI_PLANETS.map(({ pos, radius, color, glow }) => {
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius, 1),
        new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.7 })
      );
      mesh.position.set(...pos);
      scene.add(mesh);
      const glowSprite = makeGlowSprite(glow, radius * 4.5);
      glowSprite.position.set(...pos);
      scene.add(glowSprite);
      return mesh;
    });

    const atomClusters = ATOM_CLUSTERS.map(({ pos, color, scale }) => {
      const group = makeAtomCluster(color, scale);
      group.position.set(...pos);
      scene.add(group);
      return group;
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    const parallax = createPointerParallax(document.body, camera, baseQuaternion, {
      yawAmount: 0.05,
      pitchAmount: 0.03,
      xShift: 0.4,
      yShift: 0.2,
    });

    let rafId;
    const starPositions = stars.geometry.attributes.position;
    const clock = new THREE.Clock();

    function renderFrame() {
      const dt = Math.min(clock.getDelta(), 0.05);

      for (let i = 0; i < STAR_COUNT; i++) {
        const idx = i * 3 + 1;
        let y = starPositions.array[idx] + dt * 0.25;
        if (y > FIELD.h / 2) y -= FIELD.h;
        starPositions.array[idx] = y;
      }
      starPositions.needsUpdate = true;

      shapes.forEach((mesh, i) => {
        mesh.rotation.y += dt * (0.06 + i * 0.02);
        mesh.rotation.x += dt * 0.03;
      });
      miniPlanets.forEach((mesh, i) => {
        mesh.rotation.y += dt * (0.1 + i * 0.03);
      });
      atomClusters.forEach((group, i) => {
        group.rotation.y += dt * (0.15 + i * 0.04);
        group.rotation.x += dt * 0.07;
      });

      parallax.update();

      renderer.render(scene, camera);
      if (!reduceMotion) rafId = requestAnimationFrame(renderFrame);
    }

    renderFrame();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      parallax.dispose();
      window.removeEventListener("resize", resize);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 -z-50 h-screen w-screen" />;
}
