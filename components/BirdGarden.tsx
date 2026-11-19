"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

/*
  BirdGarden — a transparent strip fixed to the bottom of every page.
  A handful of small Korean passerines hop between seeds inside the content
  column. Every so often one flies off and another (random species) drops in.
  Click empty space near the bottom to scatter seeds; a fast swipe flushes them.

  Rig per bird
    g ─ body (pitch / crouch) ─ torso, neck, head (yaw/pitch), wings, tail fan
      └ hips ─ leg ×2: hip → tibia → ankle → tarsus → foot (toes + claws)
  Hops are a 4-phase cycle: crouch → push-off → airborne tuck → landing absorb.
*/

const STRIP_H = 240;      // px height of the overlay
const PX = 34;            // px per world unit
const GROUND_PAD = 0.9;   // world units between screen bottom and ground line
const DEPTH = 0.7;        // ground half-depth (z)
const MAX_SEEDS = 30;

// ---------------------------------------------------------------- species
type Paint = (n: THREE.Vector3) => number;
type Spec = {
  ko: string; en: string;
  size: number; plump: number; headR: number;
  paintHead: Paint; paintBody: Paint;
  wing: number;
  wingBands?: { from: number; to: number; color: number }[];
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
    ko: "오목눈이", en: "Long-tailed Tit", size: 1, plump: 1.12, headR: 0.2,
    paintHead: (n) => (n.y > 0.05 && n.y < 0.5 && side(n) > 0.35 && n.x < 0.55) || (n.x < -0.55 && n.y > 0.05) ? 0x161616 : 0xf8f6f4,
    paintBody: (n) => n.y > 0.25 ? 0x1e1e1e : n.y > -0.05 && n.x < 0.1 ? 0xe2b9bb : n.x > 0.2 ? 0xf7f4f2 : 0xf0e2e2,
    wing: 0x242424, primaries: 0x151515,
    wingBands: [{ from: 0, to: 0.32, color: 0xd9a3a6 }],
    tail: 0x181818, tailEdge: 0xf2f2f2, tailLen: 1.1,
    bill: 0x111111, billR: 0.03, billL: 0.06, legs: 0x2a2a2a,
  },
  { // 붉은머리오목눈이 Sinosuthora webbiana — rufous crown and wings, pinkish throat, buff-brown body, stubby pale bill
    ko: "붉은머리오목눈이", en: "Vinous-throated Parrotbill", size: 1, plump: 1.08, headR: 0.2,
    paintHead: (n) => n.y < -0.35 && n.x > -0.2 ? 0xd7a691 : n.y > -0.1 ? 0xa65934 : 0xb8775a,
    paintBody: (n) => n.y > 0.2 ? 0x8f6f58 : n.x > 0.2 ? 0xd3a68e : 0xd8bba6,
    wing: 0x8b5434, primaries: 0x6e4430,
    tail: 0x7d5c46, tailLen: 0.75,
    bill: 0xc4b39c, billR: 0.07, billL: 0.09, legs: 0x8a7a6a,
  },
  { // 박새 Parus minor — glossy black head and throat, white cheeks, black ventral "tie",
    // olive-green mantle, blue-grey wings with a white bar
    ko: "박새", en: "Japanese Tit", size: 1, plump: 1, headR: 0.21,
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
    ko: "곤줄박이", en: "Varied Tit", size: 1, plump: 1, headR: 0.21,
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
    ko: "쇠박새", en: "Marsh Tit", size: 1, plump: 1.02, headR: 0.2,
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
    ko: "되새", en: "Brambling", size: 1, plump: 0.96, headR: 0.2,
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
    ko: "진박새", en: "Coal Tit", size: 1, plump: 1, headR: 0.21,
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

// ---------------------------------------------------------------- model helpers
const _c = new THREE.Color();
const _n = new THREE.Vector3();
const hash = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};
/** Per-vertex colour from a paint function, with fine feather grain and a soft underside shade. */
function paint(geo: THREE.BufferGeometry, fn: (n: THREE.Vector3, p: THREE.Vector3) => number, grain = 0.07, center = new THREE.Vector3()) {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    _n.copy(p).sub(center).normalize();
    _c.setHex(fn(_n, p)).convertSRGBToLinear();
    const k = 1 + (hash(p.x * 9, p.y * 9, p.z * 9) - 0.5) * 2 * grain - Math.max(0, -_n.y - 0.6) * 0.18;
    col.set([_c.r * k, _c.g * k, _c.b * k], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}
const shape = (outline: [number, number][]) => {
  const s = new THREE.Shape();
  outline.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
};
/** A single feather blade lying in the XZ plane, quill at the origin, pointing along -x. */
function featherBlade(len: number, width: number, thick = 0.012) {
  const w = width / 2;
  const geo = new THREE.ExtrudeGeometry(
    shape([[0, -w * 0.4], [-len * 0.25, -w], [-len * 0.8, -w * 0.9], [-len, -w * 0.2], [-len * 1.02, 0], [-len, w * 0.3], [-len * 0.8, w], [-len * 0.25, w], [0, w * 0.4]]),
    { depth: thick, bevelEnabled: false, curveSegments: 1 },
  );
  geo.rotateX(Math.PI / 2);
  return geo;
}
const shade = (hex: number, k: number) => new THREE.Color(hex).multiplyScalar(k).getHex();

type Rig = {
  g: THREE.Group; body: THREE.Group; head: THREE.Group; hips: THREE.Group;
  tail: THREE.Group; tailFeathers: THREE.Object3D[];
  wingL: THREE.Group; wingR: THREE.Group; flightL: THREE.Object3D[]; flightR: THREE.Object3D[];
  legs: { hip: THREE.Group; ankle: THREE.Group; foot: THREE.Group }[];
  mats: THREE.Material[];
};

const L1 = 0.12, L2 = 0.17, HIP_Y = 0.28;   // tibia, tarsus, hip height
const STAND: [number, number] = [0.5, 0.25];
const CROUCH: [number, number] = [1.05, 0.75];

function buildBird(sp: Spec): Rig {
  const mats: THREE.Material[] = [];
  const M = <T extends THREE.Material>(m: T) => { mats.push(m); return m; };
  const featherMat = M(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }));
  const featherMat2 = M(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }));
  const solid = new Map<number, THREE.MeshStandardMaterial>();
  const S = (c: number, rough = 0.6) => {
    let m = solid.get(c);
    if (!m) { m = M(new THREE.MeshStandardMaterial({ color: c, roughness: rough })); solid.set(c, m); }
    return m;
  };

  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);

  // torso: lathe teardrop, high resolution
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const r = 0.31 * sp.plump * Math.pow(Math.sin(Math.PI * t), 0.72) * (0.6 + 0.4 * t);
    pts.push(new THREE.Vector2(Math.max(r, 0.001), -0.44 + t * 0.8));
  }
  const torsoGeo = new THREE.LatheGeometry(pts, 40);
  torsoGeo.rotateZ(-Math.PI / 2);
  torsoGeo.scale(1, 1.02, 0.94);
  torsoGeo.computeVertexNormals();
  const torso = new THREE.Mesh(paint(torsoGeo, (n) => sp.paintBody(n)), featherMat);
  torso.position.y = 0.46;
  body.add(torso);

  // neck: bridges head and breast so they read as one bird
  const neckGeo = new THREE.SphereGeometry(0.17, 28, 20);
  neckGeo.scale(1.05, 1, 0.95);
  const neck = new THREE.Mesh(paint(neckGeo, (n) => (n.y < -0.1 || n.x > 0.4 ? sp.paintBody(new THREE.Vector3(0.6, n.y - 0.2, n.z).normalize()) : sp.paintHead(new THREE.Vector3(-0.5, n.y, n.z).normalize()))), featherMat);
  neck.position.set(0.24, 0.62, 0);
  body.add(neck);

  // head
  const head = new THREE.Group();
  head.position.set(0.33, 0.72, 0);
  body.add(head);
  const headGeo = new THREE.SphereGeometry(sp.headR, 40, 30);
  headGeo.scale(1.06, 0.97, 0.97);
  head.add(new THREE.Mesh(paint(headGeo, (n) => sp.paintHead(n), 0.05), featherMat));
  if (sp.en === "Coal Tit") {
    const cg = new THREE.ConeGeometry(0.065, 0.15, 10); cg.translate(0, 0.075, 0);
    const c = new THREE.Mesh(cg, S(0x111111, 0.8)); c.position.set(-0.06, 0.15, 0); c.rotation.z = 0.95; head.add(c);
  }
  // eyes: dark iris, thin lid ring, catch-light
  const ringCol = shade(sp.paintHead(new THREE.Vector3(0.45, 0.25, 0.85).normalize()), 0.8);
  for (const s of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.031, 16, 12), S(0x070606, 0.15));
    eye.position.set(0.095, 0.045, 0.168 * s); head.add(eye);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.006, 6, 18), S(ringCol, 0.8));
    ring.position.copy(eye.position).multiplyScalar(1.02); ring.lookAt(eye.position.clone().multiplyScalar(3)); head.add(ring);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), M(new THREE.MeshBasicMaterial({ color: 0xffffff })));
    glint.position.set(0.112, 0.06, 0.19 * s); head.add(glint);
  }
  // bill: upper and lower mandibles, culmen slightly hooked down
  const bx = sp.headR * 0.9;
  const upGeo = new THREE.ConeGeometry(sp.billR, sp.billL, 14); upGeo.rotateZ(-Math.PI / 2); upGeo.scale(1, 0.95, 0.85);
  const up = new THREE.Mesh(upGeo, S(sp.bill, 0.35)); up.position.set(bx + sp.billL / 2, 0.0, 0); up.rotation.z = -0.06; head.add(up);
  const loGeo = new THREE.ConeGeometry(sp.billR * 0.82, sp.billL * 0.82, 14); loGeo.rotateZ(-Math.PI / 2); loGeo.scale(1, 0.8, 0.8);
  const lo = new THREE.Mesh(loGeo, S(shade(sp.bill, 0.82), 0.4)); lo.position.set(bx + sp.billL * 0.4, -0.028, 0); lo.rotation.z = -0.1; head.add(lo);

  // tail: six rectrices on a fan; pale outer edges where the species has them
  const tail = new THREE.Group();
  tail.position.set(-0.36, 0.5, 0); tail.rotation.z = 0.2;
  body.add(tail);
  const tailFeathers: THREE.Object3D[] = [];
  const nT = 6;
  for (let i = 0; i < nT; i++) {
    const u = i / (nT - 1) - 0.5;              // -0.5 … 0.5
    const outer = abs(u) > 0.4;
    const len = sp.tailLen * (sp.tailFork ? 0.88 + abs(u) * 0.3 : 1 - abs(u) * 0.12);
    const geo = featherBlade(len, 0.075, 0.01);
    paint(geo, (_n, p) => (sp.tailEdge && outer && p.z * Math.sign(u) > 0.005) || (sp.tailEdge && outer && p.x < -len * 0.6) ? sp.tailEdge : (abs(p.z) > 0.03 ? shade(sp.tail, 1.18) : sp.tail), 0.04);
    const f = new THREE.Mesh(geo, featherMat2);
    f.position.set(0, 0.003 * (3 - abs(i - 2.5)), u * 0.05);
    f.userData.u = u;
    tail.add(f); tailFeathers.push(f);
  }

  // wings: covert panel with wingbars + individual flight feathers that fan out in flight
  const makeWing = (sd: 1 | -1) => {
    const pivot = new THREE.Group();
    pivot.position.set(-0.01, 0.62, 0.19 * sd);
    const covGeo = new THREE.ExtrudeGeometry(shape([[0.14, 0], [0.13, 0.11], [0.05, 0.22], [-0.08, 0.27], [-0.2, 0.22], [-0.24, 0.1], [-0.17, 0]]), { depth: 0.024, bevelEnabled: false });
    covGeo.rotateX(Math.PI / 2);
    if (sd === -1) covGeo.scale(1, 1, -1);
    paint(covGeo, (_n, p) => {
      const span = abs(p.z) / 0.37;
      for (const b of sp.wingBands ?? []) if (span >= b.from && span <= b.to) return b.color;
      return sp.wing;
    }, 0.06);
    pivot.add(new THREE.Mesh(covGeo, featherMat2));
    const flight: THREE.Object3D[] = [];
    const nF = 7;
    for (let i = 0; i < nF; i++) {
      const u = i / (nF - 1);                  // 0 inner (secondary) … 1 outer primary
      const len = 0.26 + u * 0.12;
      const geo = featherBlade(len, 0.085, 0.01);
      if (sd === -1) geo.scale(1, 1, -1);
      const base = sp.wingBands?.some((b) => b.from >= 0.36) && u < 0.35 ? sp.wing : sp.primaries;
      paint(geo, (_n, p) => (abs(p.z) > 0.03 ? shade(base, 1.45) : base), 0.04);
      const holder = new THREE.Group();
      holder.position.set(-0.06 - u * 0.1, -0.006 - i * 0.0015, (0.1 + u * 0.2) * sd);
      const f = new THREE.Mesh(geo, featherMat2);
      holder.add(f);
      holder.userData.u = u; holder.userData.sd = sd;
      pivot.add(holder); flight.push(holder);
    }
    body.add(pivot);
    return { pivot, flight };
  };
  const wl = makeWing(1), wr = makeWing(-1);

  // legs: hip → tibia (feathered) → ankle → tarsus → foot with 3 front toes, hallux and claws
  const hips = new THREE.Group();
  g.add(hips);
  const legMat = S(sp.legs, 0.55), clawMat = S(shade(sp.legs, 0.5), 0.4);
  const thighCol = sp.paintBody(new THREE.Vector3(0, -0.8, 0.6).normalize());
  const legs = [1, -1].map((sd) => {
    const hip = new THREE.Group(); hip.position.set(0.03, HIP_Y, 0.08 * sd); hips.add(hip);
    const tg = new THREE.CylinderGeometry(0.032, 0.02, L1, 8); tg.translate(0, -L1 / 2, 0);
    hip.add(new THREE.Mesh(tg, S(thighCol, 0.95)));
    const ankle = new THREE.Group(); ankle.position.y = -L1; hip.add(ankle);
    const ag = new THREE.CylinderGeometry(0.013, 0.015, L2, 8); ag.translate(0, -L2 / 2, 0);
    ankle.add(new THREE.Mesh(ag, legMat));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), legMat); ankle.add(knob);
    const foot = new THREE.Group(); foot.position.y = -L2; ankle.add(foot);
    for (const [a, len] of [[-0.5, 0.085], [0, 0.1], [0.5, 0.085], [Math.PI, 0.07]] as const) {
      const toe = new THREE.Group(); toe.rotation.y = -a; foot.add(toe);
      const tgeo = new THREE.CylinderGeometry(0.008, 0.011, len, 6); tgeo.rotateZ(Math.PI / 2); tgeo.translate(len / 2, 0, 0);
      const t = new THREE.Mesh(tgeo, legMat); t.position.y = -0.01; toe.add(t);
      const cg = new THREE.ConeGeometry(0.007, 0.03, 6); cg.rotateZ(-Math.PI / 2 - 0.5);
      const claw = new THREE.Mesh(cg, clawMat); claw.position.set(len + 0.008, -0.016, 0); toe.add(claw);
    }
    return { hip, ankle, foot };
  });

  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
  return { g, body, head, hips, tail, tailFeathers, wingL: wl.pivot, wingR: wr.pivot, flightL: wl.flight, flightR: wr.flight, legs, mats };
}

// ---------------------------------------------------------------- pose helpers
const legDrop = (a: number, b: number) => L1 * (Math.cos(STAND[0]) - Math.cos(a)) + L2 * (Math.cos(STAND[1]) - Math.cos(b));
function setLegs(r: Rig, a: number, b: number) {
  for (const l of r.legs) {
    l.hip.rotation.z = a;               // tibia swings forward
    l.ankle.rotation.z = -(a + b);      // tarsus angles back
    l.foot.rotation.z = b;              // foot stays level
  }
}
/** Set leg angles and lower body/hips so the feet stay on the ground. */
function stance(r: Rig, a: number, b: number, grounded = true) {
  setLegs(r, a, b);
  const d = grounded ? -legDrop(a, b) : 0;
  r.body.position.y = d; r.hips.position.y = d;
}
const FOLD = 1.4;
function wings(r: Rig, angle: number, spread: number) {
  r.wingL.rotation.x = angle; r.wingR.rotation.x = -angle;
  for (const f of r.flightL) f.rotation.y = spread * (0.15 + f.userData.u * 0.55);
  for (const f of r.flightR) f.rotation.y = -spread * (0.15 + f.userData.u * 0.55);
}
function fanTail(r: Rig, spread: number) {
  for (const f of r.tailFeathers) f.rotation.y = f.userData.u * spread;
}
const lerp = THREE.MathUtils.lerp;
const ease = (x: number) => x * x * (3 - 2 * x);

// ---------------------------------------------------------------- behaviour
type Mode = "idle" | "hop" | "peck" | "fly" | "land" | "leave";
type Bird = Rig & {
  sp: Spec; mode: Mode; t: number; vel: THREE.Vector3;
  target: THREE.Vector3 | null; seed: THREE.Mesh | null; pecks: number; phase: number;
  hopFrom: THREE.Vector3; hopTo: THREE.Vector3; hopDur: number; wait: number;
  alpha: number; absorb: number; flightTime: number;
};
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function setAlpha(b: Bird, a: number) {
  if (a === b.alpha) return;
  b.alpha = a;
  for (const m of b.mats) { m.transparent = a < 1; m.opacity = a; }
  b.g.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = a > 0.6; });
}

export function BirdGarden() {
  const hostRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const hidden = pathname?.startsWith("/admin") || pathname?.startsWith("/studio");

  useEffect(() => {
    const host = hostRef.current;
    if (!host || hidden) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-4, 10, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 512);
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 10), new THREE.ShadowMaterial({ opacity: 0.1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const B = { lo: -10, hi: 10, skyTop: 4 };   // x-range = the page content column

    // ---------- seeds
    const seedGeom = new THREE.SphereGeometry(0.045, 8, 6);
    seedGeom.scale(1.5, 0.7, 1);
    const seedMats = [0xc9a66b, 0x8b6b3d, 0x3a3a3a].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
    const seeds: THREE.Mesh[] = [];
    const claimed = new Set<THREE.Mesh>();
    const clampX = (x: number) => THREE.MathUtils.clamp(x, B.lo, B.hi);
    const clampZ = (z: number) => THREE.MathUtils.clamp(z, -DEPTH, DEPTH);
    const addSeed = (x: number, z: number) => {
      if (seeds.length >= MAX_SEEDS) return;
      const s = new THREE.Mesh(seedGeom, seedMats[(Math.random() * 3) | 0]);
      s.position.set(clampX(x), 0.03, clampZ(z));
      s.rotation.y = Math.random() * Math.PI;
      s.castShadow = true;
      scene.add(s); seeds.push(s);
    };
    const scatter = (cx: number, n: number, r: number) => { for (let i = 0; i < n; i++) addSeed(cx + rand(-r, r), rand(-DEPTH, DEPTH)); };
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
      const shell = document.querySelector(".shell");
      let left = 0, right = w;
      if (shell) {
        const r = shell.getBoundingClientRect(), cs = getComputedStyle(shell);
        left = r.left + parseFloat(cs.paddingLeft); right = r.right - parseFloat(cs.paddingRight);
      }
      B.lo = left / PX - hw + 0.5;
      B.hi = right / PX - hw - 0.5;
      if (B.hi < B.lo) B.lo = B.hi = (B.lo + B.hi) / 2;
      B.skyTop = h / PX - GROUND_PAD - 0.8;
    };
    layout();

    // ---------- birds
    const birds: Bird[] = [];
    const population = Math.round(THREE.MathUtils.clamp((B.hi - B.lo) * PX / 170, 3, 6));
    const spawn = (arriving: boolean) => {
      const sp = SPECIES[(Math.random() * SPECIES.length) | 0];
      const rig = buildBird(sp);
      const scale = 0.92;
      rig.g.scale.setScalar(scale);
      const b: Bird = {
        ...rig, sp, mode: "idle", t: rand(0, 1), vel: new THREE.Vector3(), target: null, seed: null, pecks: 0,
        phase: Math.random() * 10, hopFrom: new THREE.Vector3(), hopTo: new THREE.Vector3(), hopDur: 0.3, wait: 0,
        alpha: 1, absorb: 0, flightTime: 0,
      };
      if (arriving && !calm) {
        b.g.position.set(rand(B.lo, B.hi), B.skyTop + 1.2, rand(-DEPTH, DEPTH));
        setAlpha(b, 0.001);
        b.vel.set(rand(-2, 2), -1, 0);
        beginLanding(b);
      } else {
        b.g.position.set(rand(B.lo, B.hi), 0, rand(-DEPTH, DEPTH));
        stance(b, ...STAND);
        wings(b, FOLD, 0);
      }
      b.g.rotation.y = Math.random() < 0.5 ? 0 : Math.PI;
      scene.add(b.g);
      birds.push(b);
      return b;
    };
    const despawn = (b: Bird) => {
      if (b.seed) { claimed.delete(b.seed); b.seed = null; }
      scene.remove(b.g);
      b.g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
      b.mats.forEach((m) => m.dispose());
      birds.splice(birds.indexOf(b), 1);
    };

    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
    const face = (b: Bird, dir: THREE.Vector3, k: number) => {
      const yaw = Math.atan2(-dir.z, dir.x);
      const d = Math.atan2(Math.sin(yaw - b.g.rotation.y), Math.cos(yaw - b.g.rotation.y));
      b.g.rotation.y += d * Math.min(1, k);
    };
    const nearestFreeSeed = (p: THREE.Vector3) => {
      let best: THREE.Mesh | null = null, bd = Infinity;
      for (const s of seeds) { if (claimed.has(s)) continue; const d = s.position.distanceToSquared(p); if (d < bd) { bd = d; best = s; } }
      return best;
    };
    function beginLanding(b: Bird) {
      const s = nearestFreeSeed(b.g.position);
      const x = s ? s.position.x + rand(-0.6, 0.6) : rand(B.lo, B.hi);
      b.target = new THREE.Vector3(clampX(x), 0, rand(-DEPTH, DEPTH));
      b.mode = "land"; b.t = 0;
    }
    const takeOff = (b: Bird, leave: boolean, burst = 1) => {
      if (calm) return;
      if (b.seed) { claimed.delete(b.seed); b.seed = null; }
      b.mode = leave ? "leave" : "fly"; b.t = 0; b.target = null;
      b.flightTime = rand(1.2, 2.6);
      b.vel.set(rand(-2.5, 2.5) * burst, 3.5 * burst, 0);
      stance(b, ...CROUCH);
    };
    const startHop = (b: Bird, to: THREE.Vector3) => {
      b.hopFrom.copy(b.g.position); b.hopFrom.y = 0;
      tmp.subVectors(to, b.hopFrom); tmp.y = 0;
      const d = Math.min(tmp.length(), rand(0.16, 0.26));
      b.hopTo.copy(b.hopFrom).addScaledVector(tmp.normalize(), d);
      b.hopTo.x = clampX(b.hopTo.x); b.hopTo.z = clampZ(b.hopTo.z);
      b.hopDur = calm ? 0.5 : rand(0.28, 0.34);
      b.mode = "hop"; b.t = 0;
    };

    const update = (b: Bird, dt: number) => {
      b.t += dt;
      const p = b.g.position;
      b.phase += dt;

      switch (b.mode) {
        case "idle": {
          wings(b, lerp(b.wingL.rotation.x, FOLD, Math.min(1, dt * 10)), 0);
          // landing absorb, then settle into a relaxed stance with a little breathing
          if (b.absorb > 0) {
            b.absorb = Math.max(0, b.absorb - dt);
            const k = ease(b.absorb / 0.22);
            stance(b, lerp(STAND[0], CROUCH[0], k), lerp(STAND[1], CROUCH[1], k));
          } else {
            const br = Math.sin(b.phase * 2.2) * 0.015;
            stance(b, STAND[0] + br, STAND[1] + br);
          }
          b.body.rotation.z = lerp(b.body.rotation.z, 0, dt * 8);
          // alert head turns — quick saccades, then hold
          if (Math.random() < dt * 2.5) b.head.userData.yaw = rand(-0.8, 0.8);
          b.head.rotation.y = lerp(b.head.rotation.y, b.head.userData.yaw ?? 0, Math.min(1, dt * 18));
          b.head.rotation.z = lerp(b.head.rotation.z, 0, dt * 10);
          b.tail.rotation.z = lerp(b.tail.rotation.z, 0.2 + Math.max(0, Math.sin(b.phase * 4)) * 0.08, dt * 10);
              if (b.target && b.wait > 0) {                   // short pause mid-route
            b.wait -= dt;
            if (b.wait <= 0) startHop(b, b.target);
            break;
          }
          if (b.head.userData.next === undefined) b.head.userData.next = rand(0.5, 1.4);
          if (b.t > (calm ? 2.2 : b.head.userData.next)) {
            b.head.userData.next = rand(0.5, 1.4);
            b.t = 0;
            const s = nearestFreeSeed(p);
            const r = Math.random();
            if (!calm && r < 0.04) takeOff(b, true);
            else if (s && r < 0.75) { b.seed = s; claimed.add(s); b.target = s.position.clone(); startHop(b, b.target); }
            else if (r < 0.9) { b.target = new THREE.Vector3(clampX(p.x + rand(-1.5, 1.5)), 0, rand(-DEPTH, DEPTH)); startHop(b, b.target); }
          }
          break;
        }
        case "hop": {
          b.head.userData.yaw = 0;
          b.head.rotation.y = lerp(b.head.rotation.y, 0, dt * 15);
          tmp.subVectors(b.hopTo, b.hopFrom); tmp.y = 0;
          if (tmp.lengthSq() > 1e-6) face(b, tmp, dt * 18);
          const u = Math.min(1, b.t / b.hopDur);
          if (u < 0.22) {                                  // crouch
            const k = ease(u / 0.22);
            stance(b, lerp(STAND[0], CROUCH[0], k), lerp(STAND[1], CROUCH[1], k));
            b.body.rotation.z = lerp(0, -0.12, k);           // lean in
            b.tail.rotation.z = lerp(0.2, 0.32, k);
          } else if (u < 0.8) {                            // push-off → airborne
            const a = (u - 0.22) / 0.58;
            const h = 0.13 * 4 * a * (1 - a);
            p.lerpVectors(b.hopFrom, b.hopTo, ease(a)); p.y = h;
            // legs snap straight on push, then tuck under the belly
            const ext = Math.min(1, a / 0.2);
            const tuck = Math.max(0, (a - 0.2) / 0.8);
            const la = a < 0.2 ? lerp(CROUCH[0], 0.15, ext) : lerp(0.15, 0.85, Math.sin(tuck * Math.PI));
            const lb = a < 0.2 ? lerp(CROUCH[1], -0.05, ext) : lerp(-0.05, 1.0, Math.sin(tuck * Math.PI));
            stance(b, la, lb, false);
            b.body.position.y = 0; b.hips.position.y = 0;
            b.body.rotation.z = lerp(-0.12, 0.1, a);         // pitch up then level
            b.head.rotation.z = -b.body.rotation.z * 0.7;    // head stays steady
            b.tail.rotation.z = lerp(0.32, 0.05, Math.sin(a * Math.PI));
            wings(b, FOLD - Math.sin(a * Math.PI) * 0.15, 0); // little wing flick
          } else {                                         // landing absorb
            p.copy(b.hopTo);
            const k = (u - 0.8) / 0.2;
            const c = Math.sin(k * Math.PI);
            stance(b, lerp(STAND[0], CROUCH[0] * 0.85, c), lerp(STAND[1], CROUCH[1] * 0.85, c));
            b.body.rotation.z = lerp(0.1, 0, k);
            b.head.rotation.z = lerp(b.head.rotation.z, 0, 0.3);
            b.tail.rotation.z = 0.2 + c * 0.18;              // tail dips for balance
            wings(b, FOLD, 0);
          }
          if (u >= 1) {
            p.y = 0;
            if (!b.target) { b.mode = "idle"; b.t = 0; break; }
            tmp.subVectors(b.target, p); tmp.y = 0;
            if (tmp.length() < 0.2) { b.target = null; if (b.seed) { b.mode = "peck"; b.pecks = 0; } else b.mode = "idle"; b.t = 0; }
            else if (b.seed && !seeds.includes(b.seed)) { b.seed = null; b.mode = "idle"; b.t = 0; }
            else { b.wait = Math.random() < 0.35 ? rand(0.1, 0.5) : 0; if (b.wait === 0) startHop(b, b.target); else { b.mode = "idle"; b.t = 0; } }
          }
          // personal space
          for (const o of birds) {
            if (o === b || o.mode === "fly" || o.mode === "leave" || o.mode === "land") continue;
            tmp2.subVectors(b.hopTo, o.g.position); tmp2.y = 0;
            const dd = tmp2.length();
            if (dd > 0 && dd < 0.5) { b.hopTo.addScaledVector(tmp2.normalize(), (0.5 - dd) * dt * 4); b.hopTo.x = clampX(b.hopTo.x); b.hopTo.z = clampZ(b.hopTo.z); }
          }
          break;
        }
        case "peck": {
          // crouch a little, tip the body forward from the hips, head strikes and recoils
          const k = Math.max(0, Math.sin(b.t * 11));
          const kk = k * k;
          stance(b, lerp(STAND[0], 0.85, kk), lerp(STAND[1], 0.55, kk));
          b.body.rotation.z = -kk * 0.55;
          b.head.rotation.z = -kk * 0.35;
          b.tail.rotation.z = 0.2 + kk * 0.35;
          if (b.t * 11 > Math.PI * 2 * (b.pecks + 1)) {
            b.pecks++;
            if (b.seed && b.pecks >= 2) { removeSeed(b.seed); b.seed = null; }
            if (b.pecks >= 3) { b.mode = "idle"; b.t = 0; b.body.rotation.z = 0; b.head.rotation.z = 0; }
          }
          break;
        }
        case "fly":
        case "leave": {
          b.flightTime -= dt;
          const flapRate = 26;
          const ph = b.t * flapRate;
          wings(b, 0.2 + Math.sin(ph) * 1.15, 0.6 + Math.sin(ph + 0.6) * 0.4);
          stance(b, 1.35, 1.7, false);                     // feet tucked
          b.body.position.y = 0; b.hips.position.y = 0;
          b.body.rotation.z = lerp(b.body.rotation.z, 0.12, dt * 4);
          b.head.rotation.z = -0.1;
          b.tail.rotation.z = 0.05; fanTail(b, 0.25);
          if (b.mode === "leave") {
            tmp.set(b.vel.x >= 0 ? 4 : -4, 6, 0);
            b.vel.lerp(tmp, Math.min(1, dt * 1.5));
            if (p.y > B.skyTop - 0.6) setAlpha(b, Math.max(0, b.alpha - dt * 1.8));
          } else {
            if (!b.target) b.target = new THREE.Vector3(clampX(p.x + rand(-3, 3)), rand(1.4, B.skyTop - 0.4), clampZ(p.z));
            tmp.subVectors(b.target, p).normalize().multiplyScalar(4.5);
            b.vel.lerp(tmp, Math.min(1, dt * 2));
            if (b.flightTime <= 0) beginLanding(b);
          }
          p.addScaledVector(b.vel, dt);
          if (b.mode === "fly") p.x = clampX(p.x);
          p.z = clampZ(p.z);
          tmp2.copy(b.vel); tmp2.y = 0;
          if (tmp2.lengthSq() > 0.01) face(b, tmp2, dt * 6);
          b.g.rotation.z = THREE.MathUtils.clamp(b.vel.y * 0.07, -0.35, 0.35);
          break;
        }
        case "land": {
          if (b.alpha < 1) setAlpha(b, Math.min(1, b.alpha + dt * 1.6));
          tmp.subVectors(b.target!, p);
          const d = tmp.length();
          const near = THREE.MathUtils.clamp(1 - d / 1.5, 0, 1);
          // flap, then flare: wings high and spread, tail fanned, legs reaching forward
          const ph = b.t * (22 - near * 8);
          wings(b, lerp(0.2 + Math.sin(ph) * 1.0, -0.3 + Math.sin(ph) * 0.35, near), lerp(0.6, 1, near));
          fanTail(b, lerp(0.25, 0.7, near));
          stance(b, lerp(1.35, 0.1, near), lerp(1.7, -0.1, near), false);
          b.body.position.y = 0; b.hips.position.y = 0;
          b.body.rotation.z = lerp(0.1, 0.35, near);
          b.head.rotation.z = -b.body.rotation.z * 0.8;
          tmp.normalize().multiplyScalar(Math.min(4, 0.6 + d * 0.9));
          b.vel.lerp(tmp, Math.min(1, dt * 3));
          p.addScaledVector(b.vel, dt);
          p.x = clampX(p.x); p.z = clampZ(p.z);
          tmp2.copy(b.vel); tmp2.y = 0;
          if (tmp2.lengthSq() > 0.01) face(b, tmp2, dt * 6);
          b.g.rotation.z = lerp(b.g.rotation.z, 0, dt * 5);
          if (d < 0.08 || p.y <= 0) {
            p.y = 0; b.g.rotation.z = 0; b.vel.set(0, 0, 0); b.target = null;
            fanTail(b, 0); setAlpha(b, 1);
            b.mode = "idle"; b.t = 0; b.absorb = 0.22; b.body.rotation.z = 0; b.head.rotation.z = 0;
          }
          break;
        }
      }
    };

    for (let i = 0; i < population; i++) spawn(false);
    for (let i = 0; i < 3; i++) scatter(rand(B.lo, B.hi), 5, 0.6);

    // ---------- interaction (window-level; the canvas ignores the pointer)
    const toWorldX = (clientX: number) => (clientX / window.innerWidth - 0.5) * (camera.right - camera.left);
    const inStrip = (clientY: number) => clientY > window.innerHeight - STRIP_H * 0.55;
    const isInteractive = (el: EventTarget | null) =>
      el instanceof Element && !!el.closest("a,button,input,textarea,select,label,summary,video,[role=button],[contenteditable]");
    const onDown = (e: PointerEvent) => {
      if (!inStrip(e.clientY) || isInteractive(e.target)) return;
      const x = toWorldX(e.clientX);
      let flushed = false;
      for (const b of birds) if ((b.mode === "idle" || b.mode === "hop" || b.mode === "peck") && Math.abs(b.g.position.x - x) < 0.8) { takeOff(b, Math.random() < 0.3, 1.3); flushed = !calm; }
      if (!flushed) scatter(x, 6, 0.4);
    };
    let last = { x: 0, y: 0, t: 0 };
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const v = Math.hypot(e.clientX - last.x, e.clientY - last.y) / Math.max(1, now - last.t);
      last = { x: e.clientX, y: e.clientY, t: now };
      if (v < 2.5 || !inStrip(e.clientY)) return;
      const x = toWorldX(e.clientX);
      for (const b of birds) if ((b.mode === "idle" || b.mode === "hop" || b.mode === "peck") && Math.abs(b.g.position.x - x) < 1.3) takeOff(b, Math.random() < 0.3, 1.1);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", layout);

    // ---------- loop
    const clock = new THREE.Clock();
    let reseed = 0, raf = 0;
    const arrivals: number[] = [];
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (document.hidden) return;
      reseed += dt;
      if (reseed > 7 && seeds.length < 5) { reseed = 0; scatter(rand(B.lo, B.hi), 5, 0.5); }
      for (const b of [...birds]) {
        update(b, calm ? dt * 0.6 : dt);
        if (b.mode === "leave" && b.alpha <= 0) { despawn(b); arrivals.push(rand(1.5, 5)); }
      }
      // one leaves, another arrives
      for (let i = arrivals.length - 1; i >= 0; i--) {
        arrivals[i] -= dt;
        if (arrivals[i] <= 0) { arrivals.splice(i, 1); if (birds.length < population) spawn(true); }
      }
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", layout);
      [...birds].forEach(despawn);
      seeds.forEach((s) => scene.remove(s));
      seedGeom.dispose(); seedMats.forEach((m) => m.dispose());
      ground.geometry.dispose(); (ground.material as THREE.Material).dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [hidden]);

  if (hidden) return null;
  return <div ref={hostRef} className="bird-garden" aria-hidden="true" />;
}
