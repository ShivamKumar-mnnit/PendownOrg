import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeStars, makeWireShape, makeGlowSprite, makeAtomCluster, createPointerParallax } from "../lib/threeFx";
import { useIsDark } from "../lib/useIsDark";

const STAR_COUNT = 500;
const FIELD = { w: 30, h: 24, d: 22 };

const WIRE_SHAPES = [
  { kind: "ico", pos: [-5.5, 3, -6], scale: 1.1 },
  { kind: "octa", pos: [5.8, -2.8, -8], scale: 0.9 },
];

const MINI_PLANETS = [
  { pos: [6, 3.4, -5], radius: 0.28 },
  { pos: [-6.2, -3, -6], radius: 0.24 },
];

const ATOM_CLUSTERS = [
  { pos: [-4.5, -2.2, -4], scale: 1 },
  { pos: [5.2, 2.4, -6], scale: 0.85 },
];

// Night is the space scene as before; day reinterprets the same shapes as a
// sunlit sky — pastel orbs and soft light motes instead of dark planets and
// stars, so light mode is a real second theme rather than dark mode dimmed.
const PALETTES = {
  dark: {
    sky: "transparent",
    star: 0xdff4ff,
    starOpacity: 0.85,
    wire: [0x38bdf8, 0x67e8f9],
    wireOpacity: 0.35,
    planets: [0x991b1b, 0x52525b],
    glow: ["rgba(239,68,68,0.5)", "rgba(148,163,184,0.3)"],
    atoms: [0xbfe3ff, 0x99f6e4],
    ambient: 0.6,
    key: 0.9,
  },
  light: {
    sky: "linear-gradient(180deg, #e0e7ff 0%, #eef2ff 45%, #f8fafc 100%)",
    star: 0x94a3b8,
    starOpacity: 0.5,
    wire: [0x6366f1, 0x0ea5e9],
    wireOpacity: 0.4,
    planets: [0xfca5a5, 0xa5b4fc],
    glow: ["rgba(248,113,113,0.4)", "rgba(129,140,248,0.35)"],
    atoms: [0x818cf8, 0x10b981],
    ambient: 0.95,
    key: 0.5,
  },
};

/**
 * Fixed, viewport-covering WebGL backdrop mounted once in Layout — the
 * persistent "whole site" scene: drifting star/mote field, a couple of
 * wireframe shapes, small accent orbs, and atom clusters. Page content
 * scrolls independently over it (`position: fixed`), so this never remounts
 * or re-inits its WebGL context on route changes — including on theme
 * toggle, which just recolors the existing objects (see applyPalette).
 * The Hero and Why Anobyt sections paint their own opaque/local night
 * scenes on top of this one, unaffected by the toggle.
 */
export default function SpaceBackground() {
  const containerRef = useRef(null);
  const isDark = useIsDark();
  const applyPaletteRef = useRef(() => {});

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

    const shapes = WIRE_SHAPES.map(({ kind, pos, scale }) => {
      const geometry = kind === "ico" ? new THREE.IcosahedronGeometry(1, 0) : new THREE.OctahedronGeometry(1, 0);
      const mesh = makeWireShape(geometry, 0xffffff, 0.35);
      mesh.position.set(...pos);
      mesh.scale.setScalar(scale);
      return mesh;
    });
    shapes.forEach((m) => scene.add(m));

    const miniPlanets = MINI_PLANETS.map(({ pos, radius }) => {
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius, 1),
        new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.7 })
      );
      mesh.position.set(...pos);
      scene.add(mesh);
      return { mesh, radius, pos, glowSprite: null };
    });

    const atomClusters = ATOM_CLUSTERS.map(({ pos, scale }) => {
      const group = makeAtomCluster(0xffffff, scale);
      group.position.set(...pos);
      scene.add(group);
      return group;
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    function applyPalette(dark) {
      const p = dark ? PALETTES.dark : PALETTES.light;
      container.style.background = p.sky;

      stars.material.color.set(p.star);
      stars.material.opacity = p.starOpacity;

      shapes.forEach((mesh, i) => {
        mesh.material.color.set(p.wire[i]);
        mesh.material.opacity = p.wireOpacity;
      });

      miniPlanets.forEach((planet, i) => {
        planet.mesh.material.color.set(p.planets[i]);
        if (planet.glowSprite) {
          scene.remove(planet.glowSprite);
          planet.glowSprite.material.map.dispose();
          planet.glowSprite.material.dispose();
        }
        const glowSprite = makeGlowSprite(p.glow[i], planet.radius * 4.5);
        glowSprite.position.set(...planet.pos);
        scene.add(glowSprite);
        planet.glowSprite = glowSprite;
      });

      atomClusters.forEach((group, i) => {
        group.traverse((obj) => {
          if (obj.material?.color) obj.material.color.set(p.atoms[i]);
        });
      });

      ambientLight.intensity = p.ambient;
      keyLight.intensity = p.key;
    }
    applyPaletteRef.current = applyPalette;
    applyPalette(isDark);

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
      miniPlanets.forEach(({ mesh }, i) => {
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
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyPaletteRef.current(isDark);
  }, [isDark]);

  return <div ref={containerRef} className="fixed inset-0 -z-50 h-screen w-screen transition-[background] duration-500" />;
}
