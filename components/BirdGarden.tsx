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

  Models: a lathe-turned teardrop body and a round head, each painted with
  per-vertex plumage maps (cap, cheek, bib, nape, breast…), feather-shaped
  wings and tails, split bills, eye highlights and three-toed feet.
*/

const STRIP_H = 240;      // px height of the overlay
const PX = 44;            // px per world unit (bird ≈ 1 unit long)
const GROUND_PAD = 0.9;   // world units between screen bottom and ground line
const DEPTH = 0.7;        // ground half-depth (z)
const MAX_SEEDS = 36;

// ---------------------------------------------------------------- species
// Paint functions receive the unit direction from the part's centre:
// x = forward (bill), y = up, z = side.
type Paint = (n: THREE.Vector3) => number;

type Spec = {
  ko: string; en: string;
  size: number;
  plump: number;               // body roundness
  headR: number;
  paintHead: Paint;
  paintBody: Paint;
  wing: number;
  wingBands?: { from: number; to: number; color: number }[]; // bands across the folded wing (0 = shoulder … 1 = lower edge)
  primaries: number;
  tail: number; tailEdge?: number; tailLen: number; tailFork?: boolean;
  bill: number; billR: number; billL: number;
  legs: number;
};

const { abs } = Math;
const side = (n: THREE.Vector3) => abs(n.z);

const SPECIES: Spec[] = [
  { // 오목눈이 Aegithalos caudatus magnus — white head with broad black brow band to the nape,
    // black back, pinkish scapulars, white underparts washed pink, very long black tail with white edges
    ko: "오목눈이", en: "Long-tailed Tit", size: 0.72, plump: 1.12, headR: 0.2,
    paintHead: (n) => (n.y > 0.05 && n.y < 0.5 && side(n) > 0.35 && n.x < 0.55) || (n.x < -0.55 && n.y > 0.05) ? 0x161616 : 0xf8f6f4,
    paintBody: (n) => n.y > 0.25 ? 0x1e1e1e : n.y > -0.05 && n.x < 0.1 ? 0xe2b9bb : n.x > 0.2 ? 0xf7f4f2 : 0xf0e2e2,
    wing: 0x242424, primaries: 0x151515,
    wingBands: [{ from: 0, to: 0.32, color: 0xd9a3a6 }],
    tail: 0x181818, tailEdge: 0xf2f2f2, tailLen: 1.1,
    bill: 0x111111, billR: 0.03, billL: 0.06, legs: 0x2a2a2a,
  },
  { // 붉은머리오목눈이 Sinosuthora webbiana — rufous crown and wings, pinkish throat, buff-brown body, stubby pale bill
    ko: "붉은머리오목눈이", en: "Vinous-throated Parrotbill", size: 0.72, plump: 1.08, headR: 0.2,
    paintHead: (n) => n.y < -0.35 && n.x > -0.2 ? 0xd7a691 : n.y > -0.1 ? 0xa65934 : 0xb8775a,
    paintBody: (n) => n.y > 0.2 ? 0x8f6f58 : n.x > 0.2 ? 0xd3a68e : 0xd8bba6,
    wing: 0x8b5434, primaries: 0x6e4430,
    tail: 0x7d5c46, tailLen: 0.75,
    bill: 0xc4b39c, billR: 0.07, billL: 0.09, legs: 0x8a7a6a,
  },
  { // 박새 Parus minor — glossy black head and throat, white cheeks, black ventral "tie",
    // olive-green mantle, blue-grey wings with a white bar
    ko: "박새", en: "Japanese Tit", size: 0.95, plump: 1, headR: 0.21,
    paintHead: (n) => side(n) > 0.5 && n.y > -0.5 && n.y < 0.22 && n.x > -0.55 ? 0xffffff : 0x111111,
    paintBody: (n) =>
      n.y < 0.05 && n.x > 0.15 && abs(n.z) < 0.2 ? 0x111111 :                // ventral tie
      n.y < -0.45 && abs(n.z) < 0.14 ? 0x111111 :
      n.y > 0.3 && n.x > 0.0 ? 0x93a66e :                                    // olive mantle
      n.y > 0.15 ? 0x7c8792 : 0xebebe6,
    wing: 0x6f7f90, primaries: 0x4a5866,
    wingBands: [{ from: 0.28, to: 0.38, color: 0xf5f5f5 }],
    tail: 0x4f5a66, tailEdge: 0xe8e8e8, tailLen: 0.52,
    bill: 0x151515, billR: 0.042, billL: 0.11, legs: 0x5b6470,
  },
  { // 곤줄박이 Sittiparus varius — cream forehead & cheeks, black crown/eye-line and throat,
    // cream nape patch, chestnut nape-collar and underparts, blue-grey back
    ko: "곤줄박이", en: "Varied Tit", size: 0.95, plump: 1, headR: 0.21,
    paintHead: (n) =>
      n.y < -0.4 && n.x > -0.3 ? 0x141414 :                                  // throat
      n.x < -0.62 && n.y > 0.1 && n.y < 0.6 ? 0xf1e2c0 :                    // nape patch
      n.y > 0.42 && n.x < 0.78 ? 0x141414 :                                  // crown
      n.x < -0.5 ? 0xa9562a : 0xf1e2c0,                                      // collar / face
    paintBody: (n) => n.y > 0.15 ? (n.x > 0.45 ? 0xa9562a : 0x7f8c9c) : n.x > 0.25 ? 0xb4602f : 0xbf7a4a,
    wing: 0x77848f, primaries: 0x5a6570,
    tail: 0x6c7886, tailLen: 0.52,
    bill: 0x1a1a1a, billR: 0.045, billL: 0.11, legs: 0x5b6470,
  },
  { // 쇠박새 Poecile palustris — glossy black cap, small black bib, off-white cheeks, plain grey-brown
    ko: "쇠박새", en: "Marsh Tit", size: 0.82, plump: 1.02, headR: 0.2,
    paintHead: (n) =>
      n.y > 0.18 ? 0x0e0e0e :
      n.y < -0.55 && n.x > 0.15 && abs(n.z) < 0.45 ? 0x0e0e0e :
      n.x < -0.45 ? 0x958b7e : 0xf3f0ea,
    paintBody: (n) => n.y > 0.2 ? 0x958b7e : n.y > -0.2 && n.x < 0 ? 0xd9cfc0 : 0xeae5dc,
    wing: 0x857b70, primaries: 0x6d645a,
    tail: 0x7a7066, tailLen: 0.52,
    bill: 0x151515, billR: 0.038, billL: 0.09, legs: 0x5b6470,
  },
  { // 되새 Fringilla montifringilla (male, winter) — mottled dark head, orange throat/breast and shoulders,
    // white belly, black mantle with buff fringes, black wings with orange bar, yellow bill, forked tail
    ko: "되새", en: "Brambling", size: 1.05, plump: 0.96, headR: 0.2,
    paintHead: (n) => n.y < -0.3 && n.x > -0.2 ? 0xe0893a : n.y > 0.4 && Math.sin(n.x * 30) > 0.6 ? 0x5a4636 : 0x2a2320,
    paintBody: (n) =>
      n.y > 0.2 ? (Math.sin(n.x * 25) * Math.sin(n.z * 25) > 0.5 ? 0x7a5e44 : 0x2c2420) :
      n.x > 0.15 || (n.y > -0.25 && n.x > -0.3) ? 0xe0893a : 0xf3efe8,
    wing: 0x1f1916, primaries: 0x141110,
    wingBands: [{ from: 0, to: 0.18, color: 0xe0893a }, { from: 0.32, to: 0.4, color: 0xf0b070 }],
    tail: 0x1b1714, tailLen: 0.58, tailFork: true,
    bill: 0xd9b040, billR: 0.075, billL: 0.15, legs: 0x8a6a50,
  },
  { // 진박새 Periparus ater — black head with short crest and bib, white cheeks and nape spot,
    // slate back, buff underparts, two white wingbars
    ko: "진박새", en: "Coal Tit", size: 0.75, plump: 1, headR: 0.21,
    paintHead: (n) =>
      side(n) > 0.5 && n.y > -0.45 && n.y < 0.2 && n.x > -0.5 ? 0xffffff :
      n.x < -0.7 && n.y > -0.1 && n.y < 0.55 && abs(n.z) < 0.4 ? 0xffffff : 0x111111,
    paintBody: (n) => n.y > 0.2 ? 0x646d79 : n.x > 0.2 ? 0xe9e2d4 : 0xddcbaa,
    wing: 0x5a6270, primaries: 0x434a55,
    wingBands: [{ from: 0.2, to: 0.28, color: 0xffffff }, { from: 0.4, to: 0.48, color: 0xffffff }],
    tail: 0x4d5560, tailLen: 0.44,
    bill: 0x151515, billR: 0.034, billL: 0.09, legs: 0x5b6470,
  },
];

// ---------------------------------------------------------------- model
const matCache = new Map<string, THREE.Material>();
const mat = (c: number) => {
  const k = "c" + c;
  let m = matCache.get(k) as THREE.MeshStandardMaterial | undefined;
  if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }); matCache.set(k, m); }
  return m;
};
const feather = (double = false) => {
  const k = double ? "vc2" : "vc";
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: double ? THREE.DoubleSide : THREE.FrontSide });
    matCache.set(k, m);
  }
  return m;
};

const _c = new THREE.Color();
const _n = new THREE.Vector3();
/** Write a per-vertex colour attribute from a paint function over direction-from-centre. */
function paint(geo: THREE.BufferGeometry, fn: (n: THREE.Vector3, p: THREE.Vector3) => number, center = new THREE.Vector3()) {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    _n.copy(p).sub(center).normalize();
    _c.setHex(fn(_n, p)).convertSRGBToLinear();
    col.set([_c.r, _c.g, _c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

function bodyGeometry(plump: number) {
  // teardrop profile along the lathe axis (y), tail end at -0.44, breast at +0.36
  const pts: THREE.Vector2[] = [];
  const N = 22;
  for (let i = 0; i <= N; i++) {
    const t = i / N;                       // 0 tail → 1 front
    const y = -0.44 + t * 0.8;
    const r = 0.31 * plump * Math.pow(Math.sin(Math.PI * t), 0.75) * (0.62 + 0.38 * t);
    pts.push(new THREE.Vector2(Math.max(r, 0.001), y));
  }
  const geo = new THREE.LatheGeometry(pts, 28);
  geo.rotateZ(-Math.PI / 2);               // lathe axis y → +x (forward)
  geo.scale(1, 1.02, 0.94);
  geo.computeVertexNormals();
  return geo;
}

function featherShape(outline: [number, number][]) {
  const s = new THREE.Shape();
  outline.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}

function buildBird(sp: Spec) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);

  // body
  const bodyMesh = new THREE.Mesh(paint(bodyGeometry(sp.plump), (n) => sp.paintBody(n)), feather());
  bodyMesh.position.y = 0.44;
  body.add(bodyMesh);

  // head
  const head = new THREE.Group();
  head.position.set(0.32, 0.7, 0);
  body.add(head);
  const headGeo = new THREE.SphereGeometry(sp.headR, 32, 24);
  headGeo.scale(1.05, 0.98, 0.98);
  head.add(new THREE.Mesh(paint(headGeo, (n) => sp.paintHead(n)), feather()));
  // short crest for 진박새
  if (sp.en === "Coal Tit") {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 8), mat(0x111111));
    c.position.set(-0.08, 0.19, 0); c.rotation.z = 0.9; head.add(c);
  }
  // eyes with catch-light
  for (const s of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 }));
    eye.position.set(0.095, 0.045, 0.17 * s);
    head.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.set(0.112, 0.06, 0.192 * s);
    head.add(glint);
  }
  // bill: upper + lower mandible
  const bx = sp.headR * 0.92;
  const upper = new THREE.Mesh(new THREE.ConeGeometry(sp.billR, sp.billL, 10), mat(sp.bill));
  upper.rotation.z = -Math.PI / 2; upper.scale.set(1, 1, 0.85);
  upper.position.set(bx + sp.billL / 2, -0.005, 0);
  head.add(upper);
  const lower = new THREE.Mesh(new THREE.ConeGeometry(sp.billR * 0.8, sp.billL * 0.8, 10), mat(new THREE.Color(sp.bill).multiplyScalar(0.85).getHex()));
  lower.rotation.z = -Math.PI / 2 - 0.12; lower.scale.set(1, 1, 0.8);
  lower.position.set(bx + sp.billL * 0.38, -0.03, 0);
  head.add(lower);

  // tail: feather fan, pivot at the vent
  const L = sp.tailLen;
  const tailShape = sp.tailFork
    ? featherShape([[0, -0.06], [-L, -0.11], [-L * 0.88, 0], [-L, 0.11], [0, 0.06]])
    : featherShape([[0, -0.06], [-L * 0.9, -0.09], [-L, -0.04], [-L, 0.04], [-L * 0.9, 0.09], [0, 0.06]]);
  const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.025, bevelEnabled: false });
  tailGeo.rotateX(Math.PI / 2);            // shape y → z (spread sideways)
  tailGeo.translate(0, 0.012, 0);
  paint(tailGeo, (_n, p) => sp.tailEdge && abs(p.z) > 0.055 && p.x < -0.1 ? sp.tailEdge : sp.tail);
  const tail = new THREE.Mesh(tailGeo, feather(true));
  tail.position.set(-0.36, 0.5, 0); tail.rotation.z = 0.22;
  body.add(tail);

  // legs: tarsus + three forward toes and a hallux
  for (const s of [1, -1]) {
    const foot = new THREE.Group();
    foot.position.set(0.04, 0, 0.075 * s);
    const tarsus = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.2, 6), mat(sp.legs));
    tarsus.position.y = 0.1; foot.add(tarsus);
    for (const a of [-0.45, 0, 0.45, Math.PI]) {
      const toe = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, a === Math.PI ? 0.07 : 0.09, 5), mat(sp.legs));
      toe.rotation.z = Math.PI / 2;
      const len = a === Math.PI ? 0.035 : 0.045;
      toe.position.set(Math.cos(a) * len, 0.008, Math.sin(a) * len);
      toe.rotation.y = -a;
      foot.add(toe);
    }
    body.add(foot);
  }

  // wings: feather-shaped panels; pivot at the shoulder, panel extends outward (z).
  // folded = rotated down along the flank, primaries reaching back over the rump.
  const wingOutline: [number, number][] = [
    [0.13, 0], [0.12, 0.12], [0.04, 0.26], [-0.12, 0.34], [-0.3, 0.37], [-0.46, 0.33],
    [-0.4, 0.24], [-0.3, 0.12], [-0.18, 0.02],
  ];
  const makeWing = (sd: 1 | -1) => {
    const pivot = new THREE.Group();
    pivot.position.set(-0.02, 0.6, 0.19 * sd);
    const geo = new THREE.ExtrudeGeometry(featherShape(wingOutline), { depth: 0.022, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);              // shape y → +z
    if (sd === -1) geo.scale(1, 1, -1);
    paint(geo, (_n, p) => {
      const span = abs(p.z) / 0.37;        // 0 shoulder … 1 edge (= lower edge when folded)
      for (const b of sp.wingBands ?? []) if (span >= b.from && span <= b.to && p.x > -0.3) return b.color;
      if (p.x < -0.22) return sp.primaries;
      return sp.wing;
    });
    const w = new THREE.Mesh(geo, feather(true));
    pivot.add(w);
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
