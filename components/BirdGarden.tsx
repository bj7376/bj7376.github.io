"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

/*
  BirdGarden — a transparent strip fixed to the bottom of every page.
  Seven small Korean passerines hop to seeds, peck, take off, flock, and
  land again. Click empty space near the bottom to scatter seeds; a fast
  mouse swipe near the ground flushes the birds. The layer never blocks
  clicks on the page itself.
*/

const STRIP_H = 240;      // px height of the overlay
const PX = 36;            // px per world unit (bird ≈ 1 unit long)
const GROUND_PAD = 0.9;   // world units between screen bottom and ground line
const DEPTH = 0.7;        // ground half-depth (z)
const MAX_SEEDS = 36;

// ---------------------------------------------------------------- species
type Spec = {
  ko: string; en: string;
  size: number;
  body: number; belly: number; breast?: number; head: number;
  cap?: number; cheek?: number; bib?: number; nape?: number;
  eyeStripe?: number; crest?: number; bellyStripe?: number;
  wing: number; wingbars?: { color: number; n: number };
  tail: number; tailLen: number;
  bill: number; billR: number; billL: number;
};

const SPECIES: Spec[] = [
  { // 오목눈이 Aegithalos caudatus — white head, black brow band, pink scapulars, very long tail
    ko: "오목눈이", en: "Long-tailed Tit", size: 0.72,
    body: 0x2b2b2b, belly: 0xf3ecea, breast: 0xf7f4f2, head: 0xf8f6f4, eyeStripe: 0x1a1a1a,
    wing: 0x252525, wingbars: { color: 0xd9a3a6, n: 1 },
    tail: 0x1e1e1e, tailLen: 1.05, bill: 0x111111, billR: 0.035, billL: 0.07,
  },
  { // 붉은머리오목눈이 Sinosuthora webbiana — rufous crown, brown body, stubby pale bill
    ko: "붉은머리오목눈이", en: "Vinous-throated Parrotbill", size: 0.72,
    body: 0x96755d, belly: 0xd8b9a3, breast: 0xd3a68e, head: 0xa65934,
    wing: 0x8b5434, tail: 0x7d5c46, tailLen: 0.7, bill: 0xbfae98, billR: 0.07, billL: 0.1,
  },
  { // 박새 Parus minor — black head, white cheeks, black belly stripe, olive mantle
    ko: "박새", en: "Japanese Tit", size: 0.95,
    body: 0x8b9a78, belly: 0xebebe6, head: 0x121212, cheek: 0xffffff, bib: 0x121212, bellyStripe: 0x121212,
    wing: 0x6d7c8c, wingbars: { color: 0xf5f5f5, n: 1 },
    tail: 0x4f5a66, tailLen: 0.5, bill: 0x151515, billR: 0.045, billL: 0.11,
  },
  { // 곤줄박이 Sittiparus varius — cream face, black crown & throat, chestnut belly, blue-grey back
    ko: "곤줄박이", en: "Varied Tit", size: 0.95,
    body: 0x7e8b9b, belly: 0xb4602f, head: 0xf1e2c0, cap: 0x141414, bib: 0x141414, nape: 0xf1e2c0,
    wing: 0x75828f, tail: 0x6c7886, tailLen: 0.5, bill: 0x1a1a1a, billR: 0.045, billL: 0.11,
  },
  { // 쇠박새 Poecile palustris — glossy black cap, small bib, plain grey-brown
    ko: "쇠박새", en: "Marsh Tit", size: 0.82,
    body: 0x958b7e, belly: 0xe8e2d8, head: 0xf4f2ee, cap: 0x101010, bib: 0x101010,
    wing: 0x857b70, tail: 0x7a7066, tailLen: 0.5, bill: 0x151515, billR: 0.04, billL: 0.09,
  },
  { // 되새 Fringilla montifringilla — orange breast & shoulder, dark head, yellow conical bill
    ko: "되새", en: "Brambling", size: 1.05,
    body: 0x3a2e28, belly: 0xf1ede6, breast: 0xe0893a, head: 0x2b2320,
    wing: 0x231c19, wingbars: { color: 0xe0893a, n: 1 },
    tail: 0x1f1a17, tailLen: 0.55, bill: 0xd9b040, billR: 0.075, billL: 0.15,
  },
  { // 진박새 Periparus ater — black head with crest, white cheeks & nape, two white wingbars
    ko: "진박새", en: "Coal Tit", size: 0.75,
    body: 0x6c7480, belly: 0xe1d4bc, head: 0x121212, cheek: 0xffffff, nape: 0xffffff, bib: 0x121212, crest: 0x121212,
    wing: 0x5c6470, wingbars: { color: 0xffffff, n: 2 },
    tail: 0x555c66, tailLen: 0.42, bill: 0x151515, billR: 0.035, billL: 0.09,
  },
];

// ---------------------------------------------------------------- model
const matCache = new Map<number, THREE.MeshLambertMaterial>();
const mat = (c: number) => {
  let m = matCache.get(c);
  if (!m) { m = new THREE.MeshLambertMaterial({ color: c, flatShading: true }); matCache.set(c, m); }
  return m;
};
const ball = (r: number, c: number, s: [number, number, number], p: [number, number, number], detail = 1) => {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), mat(c));
  m.scale.set(...s); m.position.set(...p);
  return m;
};

function buildBird(sp: Spec) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);

  // torso (back colour), belly, optional breast
  body.add(ball(0.32, sp.body, [1.25, 0.95, 0.95], [0, 0.44, 0]));
  body.add(ball(0.27, sp.belly, [1.15, 0.85, 0.9], [0.06, 0.36, 0]));
  if (sp.breast) body.add(ball(0.2, sp.breast, [1, 1, 1.05], [0.2, 0.46, 0]));
  if (sp.bellyStripe) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.1), mat(sp.bellyStripe));
    s.position.set(0.3, 0.38, 0); s.rotation.z = 0.35; body.add(s);
  }

  // head
  const head = new THREE.Group();
  head.position.set(0.34, 0.68, 0);
  body.add(head);
  head.add(ball(0.2, sp.head, [1, 1, 1], [0, 0, 0]));
  if (sp.cap) head.add(ball(0.205, sp.cap, [1.02, 0.55, 1.02], [-0.005, 0.085, 0]));
  if (sp.bib) head.add(ball(0.11, sp.bib, [0.7, 0.9, 1.1], [0.1, -0.15, 0]));
  if (sp.nape) head.add(ball(0.075, sp.nape, [0.6, 1, 1], [-0.18, 0.03, 0]));
  if (sp.crest) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), mat(sp.crest));
    c.position.set(-0.08, 0.2, 0); c.rotation.z = 0.7; head.add(c);
  }
  for (const s of [1, -1]) {
    if (sp.cheek) head.add(ball(0.1, sp.cheek, [1.15, 0.8, 0.4], [0.02, -0.04, 0.155 * s]));
    if (sp.eyeStripe) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.03), mat(sp.eyeStripe));
      st.position.set(-0.04, 0.07, 0.17 * s); st.rotation.y = -0.25 * s; head.add(st);
    }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), mat(0x050505));
    eye.position.set(0.1, 0.05, 0.172 * s);
    head.add(eye);
  }
  const bill = new THREE.Mesh(new THREE.ConeGeometry(sp.billR, sp.billL, 5), mat(sp.bill));
  bill.rotation.z = -Math.PI / 2;
  bill.position.set(0.19 + sp.billL / 2 - 0.02, -0.02, 0);
  head.add(bill);

  // tail (pivot at base)
  const tailGeom = new THREE.BoxGeometry(sp.tailLen, 0.035, 0.15);
  tailGeom.translate(-sp.tailLen / 2, 0, 0);
  const tail = new THREE.Mesh(tailGeom, mat(sp.tail));
  tail.position.set(-0.32, 0.5, 0); tail.rotation.z = 0.22;
  body.add(tail);

  // legs
  for (const s of [1, -1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.2, 4), mat(0x4a3c32));
    leg.position.set(0.02, 0.1, 0.08 * s); body.add(leg);
  }

  // wings: pivot at shoulder, panel extends sideways; folded = hanging down along flank
  const makeWing = (side: 1 | -1) => {
    const pivot = new THREE.Group();
    pivot.position.set(-0.04, 0.58, 0.2 * side);
    const geo = new THREE.BoxGeometry(0.5, 0.03, 0.36);
    geo.translate(-0.06, 0, 0.18 * side);
    const w = new THREE.Mesh(geo, mat(sp.wing));
    pivot.add(w);
    if (sp.wingbars) {
      for (let i = 0; i < sp.wingbars.n; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.034, 0.3), mat(sp.wingbars.color));
        bar.position.set(0.08 - i * 0.12, 0.002 * side, 0.2 * side);
        pivot.add(bar);
      }
    }
    body.add(pivot);
    return pivot;
  };
  const wingL = makeWing(1);
  const wingR = makeWing(-1);

  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
  g.scale.setScalar(sp.size);
  return { g, body, head, tail, wingL, wingR };
}

// ---------------------------------------------------------------- behaviour
type Mode = "walk" | "peck" | "idle" | "fly" | "land";
type Bird = ReturnType<typeof buildBird> & {
  sp: Spec; mode: Mode; t: number; vel: THREE.Vector3;
  target: THREE.Vector3 | null; seed: THREE.Mesh | null; pecks: number; phase: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const FOLD = 1.35; // wing rest angle

export function BirdGarden() {
  const hostRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const hidden = pathname?.startsWith("/admin") || pathname?.startsWith("/studio");

  useEffect(() => {
    const host = hostRef.current;
    if (!host || hidden) return;
    // Reduced motion: birds stay on the ground and move gently; no flushing / flight.
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 1.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(-4, 10, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 512);
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 10), new THREE.ShadowMaterial({ opacity: 0.1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // world bounds, updated on resize
    const B = { x: 10, skyTop: 4 };

    // ---------- seeds
    const seedGeom = new THREE.SphereGeometry(0.05, 5, 4);
    seedGeom.scale(1.5, 0.7, 1);
    const seedMats = [0xc9a66b, 0x8b6b3d, 0x3a3a3a].map(mat);
    const seeds: THREE.Mesh[] = [];
    const claimed = new Set<THREE.Mesh>();
    const addSeed = (x: number, z: number) => {
      if (seeds.length >= MAX_SEEDS) return;
      const s = new THREE.Mesh(seedGeom, seedMats[(Math.random() * 3) | 0]);
      s.position.set(THREE.MathUtils.clamp(x, -B.x, B.x), 0.035, THREE.MathUtils.clamp(z, -DEPTH, DEPTH));
      s.rotation.y = Math.random() * Math.PI;
      s.castShadow = true;
      scene.add(s); seeds.push(s);
    };
    const scatter = (cx: number, n: number, r: number) => {
      for (let i = 0; i < n; i++) addSeed(cx + rand(-r, r), rand(-DEPTH, DEPTH));
    };
    const removeSeed = (s: THREE.Mesh) => {
      const i = seeds.indexOf(s); if (i >= 0) seeds.splice(i, 1);
      claimed.delete(s); scene.remove(s);
    };

    // ---------- layout
    const layout = () => {
      const w = window.innerWidth, h = STRIP_H;
      renderer.setSize(w, h, false);
      const hw = w / PX / 2;
      camera.left = -hw; camera.right = hw;
      camera.bottom = -GROUND_PAD; camera.top = h / PX - GROUND_PAD;
      camera.updateProjectionMatrix();
      Object.assign(sun.shadow.camera, { left: -hw - 2, right: hw + 2, top: 8, bottom: -8 });
      sun.shadow.camera.updateProjectionMatrix();
      B.x = hw - 0.8;
      B.skyTop = h / PX - GROUND_PAD - 1.2;
    };
    layout();

    // ---------- birds
    const count = Math.round(THREE.MathUtils.clamp(window.innerWidth / 110, 6, 14));
    const birds: Bird[] = [];
    for (let i = 0; i < count; i++) {
      const sp = SPECIES[i % SPECIES.length];
      const parts = buildBird(sp);
      const onGround = calm || Math.random() < 0.6;
      parts.g.position.set(rand(-B.x, B.x), onGround ? 0 : rand(1.6, B.skyTop), rand(-DEPTH, DEPTH));
      parts.g.rotation.y = Math.random() < 0.5 ? 0 : Math.PI;
      parts.wingL.rotation.x = FOLD; parts.wingR.rotation.x = -FOLD;
      scene.add(parts.g);
      birds.push({
        ...parts, sp, mode: onGround ? "idle" : "fly", t: rand(0, 2),
        vel: onGround ? new THREE.Vector3() : new THREE.Vector3(rand(-1, 1) < 0 ? -3 : 3, 0, 0),
        target: null, seed: null, pecks: 0, phase: Math.random() * 10,
      });
    }
    for (let i = 0; i < 3; i++) scatter(rand(-B.x, B.x), 5, 0.7);

    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
    const face = (b: Bird, dir: THREE.Vector3, k: number) => {
      const yaw = Math.atan2(-dir.z, dir.x);
      const d = Math.atan2(Math.sin(yaw - b.g.rotation.y), Math.cos(yaw - b.g.rotation.y));
      b.g.rotation.y += d * Math.min(1, k);
    };
    const fold = (b: Bird, dt: number) => {
      b.wingL.rotation.x = THREE.MathUtils.lerp(b.wingL.rotation.x, FOLD, dt * 10);
      b.wingR.rotation.x = THREE.MathUtils.lerp(b.wingR.rotation.x, -FOLD, dt * 10);
    };
    const flap = (b: Bird, amp: number) => {
      const a = 0.25 + Math.sin(b.phase) * amp;
      b.wingL.rotation.x = a; b.wingR.rotation.x = -a;
    };
    const takeOff = (b: Bird, burst = 1) => {
      if (calm) return;
      if (b.seed) { claimed.delete(b.seed); b.seed = null; }
      b.mode = "fly"; b.t = 0; b.target = null;
      b.vel.set(rand(-3, 3) * burst, 4 * burst, 0);
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

    const update = (b: Bird, dt: number) => {
      b.t += dt;
      const p = b.g.position;
      // tail flick on the ground
      if (b.mode !== "fly" && b.mode !== "land") b.tail.rotation.z = 0.22 + Math.max(0, Math.sin(b.t * 5 + b.phase)) * 0.15;

      switch (b.mode) {
        case "idle": {
          fold(b, dt);
          b.body.rotation.z = THREE.MathUtils.lerp(b.body.rotation.z, 0, dt * 8);
          b.head.rotation.y = Math.sin(b.t * 3 + b.phase) * 0.5;
          if (b.t > (calm ? 2.5 : 0.8)) {
            b.head.rotation.y = 0;
            const s = nearestFreeSeed(p);
            if (s && Math.random() < 0.7) {
              b.seed = s; claimed.add(s); b.target = s.position.clone(); b.mode = "walk"; b.t = 0;
            } else if (Math.random() < (seeds.length ? 0.1 : 0.4)) {
              takeOff(b);
              if ((b.mode as Mode) !== "fly") b.t = 0;
            } else {
              b.target = new THREE.Vector3(THREE.MathUtils.clamp(p.x + rand(-2.5, 2.5), -B.x, B.x), 0, rand(-DEPTH, DEPTH));
              b.mode = "walk"; b.t = 0;
            }
          }
          break;
        }
        case "walk": {
          fold(b, dt);
          if (!b.target) { b.mode = "idle"; b.t = 0; break; }
          tmp.subVectors(b.target, p); tmp.y = 0;
          if (tmp.length() < 0.3 * b.sp.size) { b.mode = b.seed ? "peck" : "idle"; b.t = 0; b.pecks = 0; p.y = 0; break; }
          tmp.normalize();
          face(b, tmp, dt * 10);
          const hop = Math.max(0, Math.sin(b.t * 14));
          p.addScaledVector(tmp, hop * dt * (calm ? 1.2 : 2.4));
          p.y = hop * 0.08;
          for (const o of birds) {
            if (o === b || o.mode === "fly" || o.mode === "land") continue;
            tmp2.subVectors(p, o.g.position); tmp2.y = 0;
            const dd = tmp2.length();
            if (dd > 0 && dd < 0.6) p.addScaledVector(tmp2.normalize(), (0.6 - dd) * dt * 6);
          }
          p.z = THREE.MathUtils.clamp(p.z, -DEPTH, DEPTH);
          if (b.t > 6) { b.mode = "idle"; b.t = 0; if (b.seed) { claimed.delete(b.seed); b.seed = null; } }
          break;
        }
        case "peck": {
          fold(b, dt);
          const k = Math.max(0, Math.sin(b.t * 12));
          b.body.rotation.z = -k * 0.75;
          if (b.t * 12 > Math.PI * 2 * (b.pecks + 1)) {
            b.pecks++;
            if (b.seed && b.pecks >= 2) { removeSeed(b.seed); b.seed = null; }
            if (b.pecks >= 3) { b.body.rotation.z = 0; b.mode = "idle"; b.t = 0; }
          }
          break;
        }
        case "fly": {
          b.body.rotation.z = 0;
          b.phase += dt * 24;
          flap(b, 1.1);
          if (!b.target || p.distanceToSquared(b.target) < 1 || b.t % 3 < dt) {
            b.target = new THREE.Vector3(rand(-B.x, B.x), rand(1.6, Math.max(1.8, B.skyTop)), rand(-DEPTH, DEPTH));
          }
          tmp.subVectors(b.target, p).normalize().multiplyScalar(5);
          tmp2.set(0, 0, 0); let n = 0;
          for (const o of birds) {
            if (o === b || o.mode !== "fly") continue;
            const d = o.g.position.distanceTo(p);
            if (d < 3) { tmp2.add(o.vel); n++; }
            if (d < 0.9 && d > 0) tmp.add(new THREE.Vector3().subVectors(p, o.g.position).normalize().multiplyScalar(4));
          }
          if (n) tmp.addScaledVector(tmp2.divideScalar(n), 0.4);
          b.vel.lerp(tmp, Math.min(1, dt * 1.2));
          b.vel.clampLength(1.5, 5.5);
          p.addScaledVector(b.vel, dt);
          p.x = THREE.MathUtils.clamp(p.x, -B.x - 1, B.x + 1);
          p.y = THREE.MathUtils.clamp(p.y, 0.3, B.skyTop + 0.6);
          p.z = THREE.MathUtils.clamp(p.z, -DEPTH, DEPTH);
          tmp2.copy(b.vel); tmp2.y = 0;
          face(b, tmp2, dt * 6);
          b.g.rotation.z = THREE.MathUtils.clamp(b.vel.y * 0.08, -0.4, 0.4);
          if (b.t > 4 && Math.random() < dt * (seeds.length ? 0.35 : 0.06)) {
            const s = nearestFreeSeed(p);
            const x = s ? s.position.x + rand(-0.7, 0.7) : rand(-B.x, B.x);
            b.target = new THREE.Vector3(THREE.MathUtils.clamp(x, -B.x, B.x), 0, rand(-DEPTH, DEPTH));
            b.mode = "land"; b.t = 0;
          }
          break;
        }
        case "land": {
          b.phase += dt * 16;
          flap(b, 0.9);
          tmp.subVectors(b.target!, p);
          const d = tmp.length();
          tmp.normalize().multiplyScalar(Math.min(4, 0.8 + d * 0.8));
          b.vel.lerp(tmp, Math.min(1, dt * 3));
          p.addScaledVector(b.vel, dt);
          tmp2.copy(b.vel); tmp2.y = 0;
          if (tmp2.lengthSq() > 0.01) face(b, tmp2, dt * 6);
          b.g.rotation.z = THREE.MathUtils.lerp(b.g.rotation.z, 0, dt * 4);
          if (d < 0.15 || p.y <= 0) {
            p.y = 0; b.g.rotation.z = 0; b.vel.set(0, 0, 0);
            b.mode = "idle"; b.t = 0; b.target = null;
          }
          break;
        }
      }
    };

    // ---------- interaction (window-level; the canvas itself ignores the pointer)
    const toWorldX = (clientX: number) => (clientX / window.innerWidth - 0.5) * (camera.right - camera.left);
    const inStrip = (clientY: number) => clientY > window.innerHeight - STRIP_H * 0.55;
    const isInteractive = (el: EventTarget | null) =>
      el instanceof Element && !!el.closest("a,button,input,textarea,select,label,summary,video,[role=button],[contenteditable]");

    const onDown = (e: PointerEvent) => {
      if (!inStrip(e.clientY) || isInteractive(e.target)) return;
      const x = toWorldX(e.clientX);
      let flushed = false;
      for (const b of birds) {
        if (b.mode !== "fly" && Math.abs(b.g.position.x - x) < 0.9) { takeOff(b, 1.4); flushed = !calm; }
      }
      if (!flushed) scatter(x, 7, 0.5);
    };
    let last = { x: 0, y: 0, t: 0 };
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const v = Math.hypot(e.clientX - last.x, e.clientY - last.y) / Math.max(1, now - last.t);
      last = { x: e.clientX, y: e.clientY, t: now };
      if (v < 2.5 || !inStrip(e.clientY)) return;
      const x = toWorldX(e.clientX);
      for (const b of birds) if (b.mode !== "fly" && Math.abs(b.g.position.x - x) < 1.5) takeOff(b, 1.2);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", layout);

    // ---------- loop
    const clock = new THREE.Clock();
    let reseed = 0, raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (document.hidden) return;
      reseed += dt;
      if (reseed > 7 && seeds.length < 5) { reseed = 0; scatter(rand(-B.x, B.x), 5, 0.6); }
      for (const b of birds) update(b, calm ? dt * 0.6 : dt);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", layout);
      scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
      matCache.forEach((m) => m.dispose()); matCache.clear();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [hidden]);

  if (hidden) return null;
  return <div ref={hostRef} className="bird-garden" aria-hidden="true" />;
}
