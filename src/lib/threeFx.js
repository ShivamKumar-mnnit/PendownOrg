import * as THREE from "three";

/** Scattered starfield, tileable across `bounds` — reused by every WebGL
 * background so they share one star look. */
export function makeStars(count, bounds) {
  const { w, h, d } = bounds;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * w;
    positions[i * 3 + 1] = (Math.random() - 0.5) * h;
    positions[i * 3 + 2] = (Math.random() - 0.5) * d;
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

/** Clean polygon-edge wireframe (not the triangulated-diagonal look of
 * `wireframe: true` materials) for floating geometric accent shapes. */
export function makeWireShape(geometry, color, opacity = 0.55) {
  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.LineSegments(edges, material);
}

/** Soft radial-gradient sprite used as a cheap glow behind spheres/orbs —
 * additive blending, no lights required. */
export function makeGlowSprite(color, size) {
  const canvasSize = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    canvasSize / 2,
    canvasSize / 2,
    0,
    canvasSize / 2,
    canvasSize / 2,
    canvasSize / 2
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  return sprite;
}

/** Small "atom" accent — a central sphere with a few smaller satellites on
 * thin translucent rods, matching the little molecule-like clusters
 * scattered through the reference art. Self-contained THREE.Group. */
export function makeAtomCluster(color, scale = 1) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
  const rodMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.09 * scale, 12, 12), material);
  group.add(core);

  const satelliteCount = 3;
  for (let i = 0; i < satelliteCount; i++) {
    const angle = (i / satelliteCount) * Math.PI * 2;
    const tilt = (i % 2 === 0 ? 1 : -1) * 0.6;
    const dist = 0.42 * scale;
    const pos = new THREE.Vector3(Math.cos(angle) * dist, Math.sin(angle) * dist * tilt, Math.sin(angle * 1.7) * dist * 0.5);

    const satellite = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 10, 10), material);
    satellite.position.copy(pos);
    group.add(satellite);

    const rodGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
    group.add(new THREE.LineSegments(rodGeometry, rodMaterial));
  }

  return group;
}

/** Smoothed cursor-parallax camera tilt, shared by every WebGL background —
 * call `update()` once per frame after computing `mouse`. */
export function createPointerParallax(container, camera, baseQuaternion, opts = {}) {
  const { yawAmount = 0.06, pitchAmount = 0.035, xShift = 0.5, yShift = 0.25, baseY = 0, ease = 0.04 } = opts;
  const mouse = { x: 0, y: 0 };
  const smoothed = { x: 0, y: 0 };

  function handleMove(e) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }
  window.addEventListener("mousemove", handleMove);

  function update() {
    smoothed.x += (mouse.x - smoothed.x) * ease;
    smoothed.y += (mouse.y - smoothed.y) * ease;
    camera.quaternion.copy(baseQuaternion);
    camera.rotateY(-smoothed.x * yawAmount);
    camera.rotateX(smoothed.y * pitchAmount);
    camera.position.x = smoothed.x * xShift;
    camera.position.y = baseY + smoothed.y * yShift;
  }

  function dispose() {
    window.removeEventListener("mousemove", handleMove);
  }

  return { update, dispose };
}
