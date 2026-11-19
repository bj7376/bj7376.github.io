"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  BirdGarden — a small feeding ground at the bottom of the home page.
  Low-poly birds walk to seeds, peck them, and take off to wander the sky
  before landing again. Click the ground to scatter seeds; click near a
  bird (or move fast over the flock) to flush it.
*/

type Mode = "walk" | "peck" | "idle" | "fly" | "land";

interface Bird {
  g: THREE.Group;
  body: THREE.Group;
  head: THREE.Mesh;
  wingL: THREE.Group;
  wingR: THREE.Group;
  mode: Mode;
  t: number;          // time in current mode
  vel: THREE.Vector3;
  target: THREE.Vector3 | null;
  seed: THREE.Mesh | null;
  pecks: number;
  flap: number;
  scale: number;
}

const GROUND = { x: 9, z: 3.2 };   // half-extents of the feeding area
const SKY = { x: 13, yMin: 2.2, yMax: 6.5, z: 6 };
const MAX_SEEDS = 40;

const PALETTES = [
  { body: 0x8a6a4f, belly: 0xe9e1d6, head: 0x5a3b28 },   // sparrow-ish
  { body: 0x3d3d3d, belly: 0xf2f2f2, head: 0x111111 },   // tit-ish
  { body: 0x9aa0a6, belly: 0xd9d4cc, head: 0x6e737a },   // dove-ish
  { body: 0x6b7a4a, belly: 0xe8e2b8, head: 0x4b5632 },   // white-eye-ish
];

function makeBird(palette: (typeof PALETTES)[number]): Omit<Bird, "mode" | "t" | "vel" | "target" | "seed" | "pecks" | "flap" | "scale"> {
  const flat = (c: number) => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);

  const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), flat(palette.body));
  torso.scale.set(1.35, 0.95, 0.95);
  torso.position.y = 0.42;
  body.add(torso);

  const belly = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), flat(palette.belly));
  belly.scale.set(1.2, 0.8, 0.85);
  belly.position.set(0.05, 0.34, 0);
  body.add(belly);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), flat(palette.head));
  head.position.set(0.38, 0.68, 0);
  body.add(head);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), flat(0x2b2b2b));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.2, -0.02, 0);
  head.add(beak);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  for (const s of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyeMat);
    eye.position.set(0.09, 0.06, 0.15 * s);
    head.add(eye);
  }

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.2), flat(palette.head));
  tail.position.set(-0.48, 0.5, 0);
  tail.rotation.z = 0.35;
  body.add(tail);

  const legMat = flat(0x5b4636);
  for (const s of [1, -1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 4), legMat);
    leg.position.set(0, 0.1, 0.09 * s);
    body.add(leg);
  }

  const wingGeom = new THREE.BoxGeometry(0.42, 0.03, 0.42);
  wingGeom.translate(0, 0, 0.21);
  const makeWing = (side: 1 | -1) => {
    const pivot = new THREE.Group();
    pivot.position.set(-0.02, 0.55, 0.2 * side);
    const w = new THREE.Mesh(wingGeom, flat(palette.head));
    if (side === -1) w.rotation.y = Math.PI;
    w.rotation.x = 0;
    pivot.add(w);
    body.add(pivot);
    return pivot;
  };
  const wingL = makeWing(1);
  const wingR = makeWing(-1);

  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
  return { g, body, head, wingL, wingR };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function BirdGarden({ count = 9 }: { count?: number }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- renderer / scene ----------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 7.5, 15);
    camera.lookAt(0, 1.2, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-5, 10, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 10, bottom: -10 });
    scene.add(sun);

    // Ground: a soft shadow catcher so the page stays white.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 30),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // A thin line where the ground is — echoes the site's hairline rules.
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(GROUND.x * 2 + 4, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xe4e4e4 }),
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.001, -GROUND.z - 0.6);
    scene.add(line);

    // ---------- seeds ----------
    const seedGeom = new THREE.SphereGeometry(0.05, 5, 4);
    seedGeom.scale(1.5, 0.7, 1);
    const seedMats = [0xc9a66b, 0x8b6b3d, 0x3a3a3a].map((c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
    const seeds: THREE.Mesh[] = [];
    const claimed = new Set<THREE.Mesh>();

    const addSeed = (x: number, z: number) => {
      if (seeds.length >= MAX_SEEDS) return;
      const s = new THREE.Mesh(seedGeom, seedMats[(Math.random() * seedMats.length) | 0]);
      s.position.set(
        THREE.MathUtils.clamp(x, -GROUND.x, GROUND.x),
        0.035,
        THREE.MathUtils.clamp(z, -GROUND.z, GROUND.z),
      );
      s.rotation.y = Math.random() * Math.PI;
      s.castShadow = true;
      scene.add(s);
      seeds.push(s);
    };
    const scatter = (cx: number, cz: number, n: number, r: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r;
        addSeed(cx + Math.cos(a) * d, cz + Math.sin(a) * d);
      }
    };
    const removeSeed = (s: THREE.Mesh) => {
      const i = seeds.indexOf(s);
      if (i >= 0) seeds.splice(i, 1);
      claimed.delete(s);
      scene.remove(s);
    };
    for (let i = 0; i < 4; i++) scatter(rand(-GROUND.x + 1, GROUND.x - 1), rand(-GROUND.z + 0.5, GROUND.z - 0.5), 5, 0.8);

    // ---------- birds ----------
    const birds: Bird[] = [];
    for (let i = 0; i < count; i++) {
      const parts = makeBird(PALETTES[i % PALETTES.length]);
      const scale = rand(0.8, 1.1);
      parts.g.scale.setScalar(scale);
      const onGround = i < count * 0.6;
      if (onGround) parts.g.position.set(rand(-GROUND.x, GROUND.x), 0, rand(-GROUND.z, GROUND.z));
      else parts.g.position.set(rand(-SKY.x, SKY.x), rand(SKY.yMin, SKY.yMax), rand(-SKY.z, 1));
      parts.g.rotation.y = Math.random() * Math.PI * 2;
      scene.add(parts.g);
      birds.push({
        ...parts, scale,
        mode: onGround ? "idle" : "fly",
        t: rand(0, 2),
        vel: onGround ? new THREE.Vector3() : new THREE.Vector3(rand(-1, 1), 0, rand(-1, 1)).normalize().multiplyScalar(3),
        target: null, seed: null, pecks: 0, flap: Math.random() * 10,
      });
    }

    const headingTo = (b: Bird, dir: THREE.Vector3, k: number) => {
      const yaw = Math.atan2(-dir.z, dir.x);
      let d = yaw - b.g.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      b.g.rotation.y += d * Math.min(1, k);
    };

    const takeOff = (b: Bird, burst = 1) => {
      if (b.seed) { claimed.delete(b.seed); b.seed = null; }
      b.mode = "fly"; b.t = 0;
      const a = Math.random() * Math.PI * 2;
      b.vel.set(Math.cos(a) * 3 * burst, 4 * burst, Math.sin(a) * 1.5 * burst);
      b.target = null;
    };

    const nearestFreeSeed = (p: THREE.Vector3) => {
      let best: THREE.Mesh | null = null, bd = Infinity;
      for (const s of seeds) {
        if (claimed.has(s)) continue;
        const d = s.position.distanceToSquared(p);
        if (d < bd) { bd = d; best = s; }
      }
      return best;
    };

    const tmp = new THREE.Vector3();
    const tmp2 = new THREE.Vector3();

    const update = (b: Bird, dt: number) => {
      b.t += dt;
      const p = b.g.position;
      const wingRest = () => {
        b.wingL.rotation.x = THREE.MathUtils.lerp(b.wingL.rotation.x, 0.15, dt * 10);
        b.wingR.rotation.x = THREE.MathUtils.lerp(b.wingR.rotation.x, -0.15, dt * 10);
      };

      switch (b.mode) {
        case "idle": {
          wingRest();
          b.body.rotation.z = THREE.MathUtils.lerp(b.body.rotation.z, 0, dt * 8);
          b.head.rotation.y = Math.sin(b.t * 3 + b.flap) * 0.5;
          if (b.t > 0.8) {
            const s = nearestFreeSeed(p);
            if (s && Math.random() < 0.7) {
              b.seed = s; claimed.add(s); b.target = s.position.clone(); b.mode = "walk"; b.t = 0;
            } else if (Math.random() < (seeds.length ? 0.08 : 0.35)) {
              takeOff(b);
            } else {
              b.target = new THREE.Vector3(
                THREE.MathUtils.clamp(p.x + rand(-2, 2), -GROUND.x, GROUND.x), 0,
                THREE.MathUtils.clamp(p.z + rand(-1.5, 1.5), -GROUND.z, GROUND.z));
              b.mode = "walk"; b.t = 0;
            }
          }
          break;
        }
        case "walk": {
          wingRest();
          b.head.rotation.y = 0;
          if (!b.target) { b.mode = "idle"; b.t = 0; break; }
          tmp.subVectors(b.target, p); tmp.y = 0;
          const dist = tmp.length();
          if (dist < 0.32 * b.scale) {
            b.mode = b.seed ? "peck" : "idle"; b.t = 0; b.pecks = 0;
            break;
          }
          tmp.normalize();
          headingTo(b, tmp, dt * 10);
          // sparrow hop: move in little bursts
          const hop = Math.max(0, Math.sin(b.t * 14));
          p.addScaledVector(tmp, hop * dt * 2.2);
          // personal space on the ground
          for (const o of birds) {
            if (o === b || o.mode === "fly" || o.mode === "land") continue;
            tmp2.subVectors(p, o.g.position); tmp2.y = 0;
            const dd = tmp2.length();
            if (dd > 0 && dd < 0.55) p.addScaledVector(tmp2.normalize(), (0.55 - dd) * dt * 6);
          }
          p.y = hop * 0.08;
          if (b.t > 6) { b.mode = "idle"; b.t = 0; if (b.seed) { claimed.delete(b.seed); b.seed = null; } }
          break;
        }
        case "peck": {
          wingRest();
          p.y = 0;
          // bob forward: rotate body around z
          const k = Math.max(0, Math.sin(b.t * 12));
          b.body.rotation.z = -k * 0.75;
          if (b.t * 12 > Math.PI * 2 * (b.pecks + 1)) {
            b.pecks++;
            if (b.seed && b.pecks >= 2) {
              removeSeed(b.seed); b.seed = null;
            }
            if (b.pecks >= 3) { b.body.rotation.z = 0; b.mode = "idle"; b.t = 0; }
          }
          break;
        }
        case "fly": {
          b.body.rotation.z = 0;
          b.flap += dt * 22;
          const a = Math.sin(b.flap) * 1.1;
          b.wingL.rotation.x = a; b.wingR.rotation.x = -a;
          p.y = Math.max(p.y, 0);

          // steer: wander + stay inside sky box + loosely flock
          if (!b.target || p.distanceToSquared(b.target) < 1 || b.t % 3 < dt) {
            b.target = new THREE.Vector3(rand(-SKY.x, SKY.x), rand(SKY.yMin, SKY.yMax), rand(-SKY.z, 1.5));
          }
          tmp.subVectors(b.target, p).normalize().multiplyScalar(5);
          // cohesion / separation with other flyers
          tmp2.set(0, 0, 0); let n = 0;
          for (const o of birds) {
            if (o === b || o.mode !== "fly") continue;
            const d = o.g.position.distanceTo(p);
            if (d < 3) { tmp2.add(o.vel); n++; }
            if (d < 0.9) tmp.addScaledVector(tmp.clone().copy(p).sub(o.g.position).normalize(), 4);
          }
          if (n) tmp.addScaledVector(tmp2.divideScalar(n), 0.4);
          b.vel.lerp(tmp, Math.min(1, dt * 1.2));
          b.vel.clampLength(1.5, 5.5);
          p.addScaledVector(b.vel, dt);
          headingTo(b, b.vel, dt * 6);
          b.g.rotation.z = THREE.MathUtils.clamp(b.vel.y * 0.08, -0.4, 0.4);

          const wantLand = b.t > 5 && Math.random() < dt * (seeds.length ? 0.35 : 0.05);
          if (wantLand) {
            const s = nearestFreeSeed(p);
            const spot = s
              ? new THREE.Vector3(s.position.x + rand(-0.6, 0.6), 0, s.position.z + rand(-0.6, 0.6))
              : new THREE.Vector3(rand(-GROUND.x, GROUND.x), 0, rand(-GROUND.z, GROUND.z));
            spot.x = THREE.MathUtils.clamp(spot.x, -GROUND.x, GROUND.x);
            spot.z = THREE.MathUtils.clamp(spot.z, -GROUND.z, GROUND.z);
            b.target = spot; b.mode = "land"; b.t = 0;
          }
          break;
        }
        case "land": {
          b.flap += dt * 16;
          const a = Math.sin(b.flap) * 0.9;
          b.wingL.rotation.x = a; b.wingR.rotation.x = -a;
          tmp.subVectors(b.target!, p);
          const d = tmp.length();
          tmp.normalize().multiplyScalar(Math.min(4, 0.8 + d * 0.8));
          b.vel.lerp(tmp, Math.min(1, dt * 3));
          p.addScaledVector(b.vel, dt);
          tmp2.copy(b.vel); tmp2.y = 0;
          if (tmp2.lengthSq() > 0.01) headingTo(b, tmp2, dt * 6);
          b.g.rotation.z = THREE.MathUtils.lerp(b.g.rotation.z, 0, dt * 4);
          if (d < 0.15 || p.y <= 0) {
            p.y = 0; b.g.rotation.z = 0; b.vel.set(0, 0, 0);
            b.mode = "idle"; b.t = 0; b.target = null;
          }
          break;
        }
      }
    };

    // ---------- interaction ----------
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const toGround = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      return raycaster.ray.intersectPlane(plane, hit);
    };
    let lastMove = { x: 0, y: 0, t: 0 };
    const onDown = (e: PointerEvent) => {
      const g = toGround(e);
      if (!g) return;
      let flushed = false;
      for (const b of birds) {
        if (b.mode !== "fly" && b.g.position.distanceTo(g) < 1.0) { takeOff(b, 1.4); flushed = true; }
      }
      if (!flushed) scatter(g.x, g.z, 7, 0.6);
    };
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const speed = Math.hypot(e.clientX - lastMove.x, e.clientY - lastMove.y) / Math.max(1, now - lastMove.t);
      lastMove = { x: e.clientX, y: e.clientY, t: now };
      if (speed < 2.5) return;   // only a fast swipe spooks them
      const g = toGround(e);
      if (!g) return;
      for (const b of birds) if (b.mode !== "fly" && b.g.position.distanceTo(g) < 1.6) takeOff(b, 1.2);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);

    // ---------- sizing / loop ----------
    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // keep the feeding ground in frame on narrow screens
      camera.position.z = w < 600 ? 22 : 15;
      camera.position.y = w < 600 ? 9 : 7.5;
      camera.lookAt(0, 1.2, 0);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" });
    io.observe(host);

    const clock = new THREE.Clock();
    let reseedTimer = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!visible) return;
      reseedTimer += dt;
      if (reseedTimer > 6 && seeds.length < 6) { reseedTimer = 0; scatter(rand(-GROUND.x + 1, GROUND.x - 1), rand(-GROUND.z + 0.5, GROUND.z - 0.5), 5, 0.7); }
      if (!reduceMotion) for (const b of birds) update(b, dt);
      renderer.render(scene, camera);
    };
    if (reduceMotion) { visible = true; loop(); cancelAnimationFrame(raf); renderer.render(scene, camera); }
    else loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [count]);

  return (
    <section className="bird-garden" aria-label="Animated birds feeding on seeds. Click the ground to scatter seeds.">
      <div ref={hostRef} className="bird-garden-canvas" />
      <p className="bird-garden-hint">click the ground to scatter seeds · move fast to flush the flock</p>
    </section>
  );
}
