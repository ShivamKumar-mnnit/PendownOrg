import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeStars, makeWireShape, makeGlowSprite, makeAtomCluster, createPointerParallax } from "../lib/threeFx";

const STAR_COUNT = 700;
const FIELD = { w: 30, h: 20, d: 20 };

// Spin is deliberately tiny — this is a logo decal, not a rotating globe,
// and the reference art shows it reading clearly and face-on at all times.
// Any real rotation speed eventually scrolls the crop off past the visible
// hemisphere and leaves a blank patch showing.
const LOGO_SPHERES = [
  { pos: [-2.1, 0.5, 0], radius: 1.6, spin: 0.008 },
  { pos: [2.0, 1.1, -1.6], radius: 1.05, spin: -0.006 },
  { pos: [-0.4, -1.5, -1], radius: 0.75, spin: 0.01 },
];

const MINI_PLANETS = [
  { kind: "rock", pos: [-5.4, -1.9, -0.5], radius: 0.32, color: 0x991b1b, glow: "rgba(239,68,68,0.55)" },
  { kind: "ring", pos: [5.3, 1.9, -1], radius: 0.32, color: 0xd97706, glow: "rgba(251,191,36,0.5)" },
  { kind: "rock", pos: [5.2, -2.2, 0.6], radius: 0.26, color: 0x52525b, glow: "rgba(148,163,184,0.35)" },
  { kind: "crystal", pos: [-5.6, 2.1, 0.3], radius: 0.5, color: 0x38bdf8 },
];

const ATOM_CLUSTERS = [
  { pos: [-3.4, 2.6, 0.5], color: 0xbfe3ff, scale: 1.3 },
  { pos: [4.6, -1.3, 1.2], color: 0x99f6e4, scale: 1 },
  { pos: [0.6, 2.7, -2], color: 0xfda4af, scale: 0.8 },
];

const NODE_COUNT = 20;
const NODE_LINK_DIST = 2.1;

function makeNetworkNodes() {
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 7.5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 3.5
      )
    );
  }

  const pointsGeometry = new THREE.BufferGeometry().setFromPoints(nodes);
  const points = new THREE.Points(
    pointsGeometry,
    new THREE.PointsMaterial({ color: 0x99e9ff, size: 0.09, transparent: true, opacity: 0.8 })
  );

  const linePositions = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].distanceTo(nodes[j]) < NODE_LINK_DIST) {
        linePositions.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
      }
    }
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(
    lineGeometry,
    new THREE.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.22 })
  );

  return { points, lines };
}

// three.js/WebGL can refuse to upload a raw SVG <img> as a texture source
// ("bad image data") depending on the GL backend — rasterizing it onto a
// canvas first sidesteps that entirely, same trick the grid texture uses.
function loadIconTexture(onReady) {
  const img = new Image();
  img.onload = () => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const scale = Math.min(size / img.width, size / img.height) * 1.75;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    const texture = new THREE.CanvasTexture(canvas);
    if ("colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
    onReady(texture);
  };
  img.src = "/anobyt-icon.svg";
}

function makeMiniPlanet({ kind, radius, color }) {
  const group = new THREE.Group();

  if (kind === "crystal") {
    const shape = makeWireShape(new THREE.IcosahedronGeometry(radius, 0), color, 0.7);
    group.add(shape);
    return group;
  }

  const sphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, kind === "rock" ? 1 : 2),
    new THREE.MeshStandardMaterial({ color, flatShading: kind === "rock", roughness: 0.6, metalness: 0.1 })
  );
  group.add(sphere);

  if (kind === "ring") {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.5, radius * 2.1, 40),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);
  }

  return group;
}

/**
 * WebGL "Why Anobyt" backdrop — a cluster of logo-textured spheres linked
 * by a thin constellation network, plus a handful of small accent planets,
 * over a drifting starfield. Same lazy-load + reduced-motion + cursor-
 * parallax pattern as VortexBackground (see HeroBackground.jsx for why).
 */
export default function PlanetNetwork({ className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9.5);
    camera.lookAt(0, 0, 0);
    const baseQuaternion = camera.quaternion.clone();

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const stars = makeStars(STAR_COUNT, FIELD);
    scene.add(stars);

    const cluster = new THREE.Group();
    scene.add(cluster);

    const { points: nodePoints, lines: nodeLines } = makeNetworkNodes();
    cluster.add(nodePoints, nodeLines);

    const logoSpheres = LOGO_SPHERES.map(({ pos, radius, spin }) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0x0a1628 })
      );
      mesh.position.set(...pos);
      const glow = makeGlowSprite("rgba(56,189,248,0.5)", radius * 3.2);
      glow.position.set(...pos);
      cluster.add(glow, mesh);
      return { mesh, spin };
    });

    loadIconTexture((texture) => {
      logoSpheres.forEach(({ mesh }) => {
        mesh.material.map = texture;
        // Placeholder color was dark so the sphere didn't flash white before
        // the texture arrived — but MeshBasicMaterial multiplies color * map,
        // so it has to reset to white now or it crushes the texture's own
        // colors back down to near-black.
        mesh.material.color.set(0xffffff);
        mesh.material.needsUpdate = true;
      });
    });

    const miniPlanets = MINI_PLANETS.map(({ pos, radius, glow: glowColor, ...rest }) => {
      const group = makeMiniPlanet({ pos, radius, ...rest });
      group.position.set(...pos);
      cluster.add(group);
      if (glowColor) {
        const glow = makeGlowSprite(glowColor, radius * 4);
        glow.position.set(...pos);
        cluster.add(glow);
      }
      return group;
    });

    const atomClusters = ATOM_CLUSTERS.map(({ pos, color, scale }) => {
      const group = makeAtomCluster(color, scale);
      group.position.set(...pos);
      cluster.add(group);
      return group;
    });

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

    const parallax = createPointerParallax(container, camera, baseQuaternion, {
      yawAmount: 0.1,
      pitchAmount: 0.06,
      xShift: 0.7,
      yShift: 0.4,
    });

    let rafId;
    const starPositions = stars.geometry.attributes.position;
    const clock = new THREE.Clock();

    function renderFrame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      for (let i = 0; i < STAR_COUNT; i++) {
        const idx = i * 3 + 1;
        let y = starPositions.array[idx] + dt * 0.35;
        if (y > FIELD.h / 2) y -= FIELD.h;
        starPositions.array[idx] = y;
      }
      starPositions.needsUpdate = true;

      cluster.rotation.y = Math.sin(t * 0.08) * 0.12;
      cluster.rotation.x = Math.sin(t * 0.06) * 0.05;

      logoSpheres.forEach(({ mesh, spin }) => {
        mesh.rotation.y += spin * dt;
      });
      miniPlanets.forEach((group, i) => {
        group.rotation.y += dt * (0.12 + i * 0.03);
      });
      atomClusters.forEach((group, i) => {
        group.rotation.y += dt * (0.18 + i * 0.05);
        group.rotation.x += dt * 0.08;
      });

      parallax.update();

      renderer.render(scene, camera);
      if (!reduceMotion) rafId = requestAnimationFrame(renderFrame);
    }

    renderFrame();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      parallax.dispose();
      resizeObserver.disconnect();
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
  }, []);

  return <div ref={containerRef} className={`h-full w-full ${className}`} />;
}
