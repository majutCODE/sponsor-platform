"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Sponsor = { name: string; bg: string; fg: string };

// Fictional example brands, shown only to illustrate sponsored tiles.
const B: Record<string, Sponsor> = {
  nova: { name: "NOVA", bg: "#c6f45b", fg: "#1d1a16" },
  pulse: { name: "pulse", bg: "#ffffff", fg: "#1d1a16" },
  orbit: { name: "orbit", bg: "#ff8fd1", fg: "#1d1a16" },
  kite: { name: "KITE", bg: "#ffd23f", fg: "#1d1a16" },
  lumen: { name: "lumen", bg: "#1d1a16", fg: "#fff6e5" },
  fizz: { name: "fizz", bg: "#2b6cff", fg: "#ffffff" },
};

const FONT = "'Bricolage Grotesque Variable', sans-serif";

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** A sticker for one tile: sold tiles show the brand, open tiles show the price. */
function logoTexture(s: Sponsor | null, price: string, aspect: number) {
  const c = document.createElement("canvas");
  c.height = 256;
  c.width = Math.round(256 * aspect);
  const g = c.getContext("2d")!;
  const pad = 10;
  roundRect(g, pad, pad, c.width - pad * 2, c.height - pad * 2, 28);
  g.textAlign = "center";
  g.textBaseline = "middle";
  if (s) {
    g.fillStyle = s.bg;
    g.fill();
    g.lineWidth = 10;
    g.strokeStyle = "#1d1a16";
    g.stroke();
    let size = 120;
    g.font = `800 ${size}px ${FONT}`;
    const max = c.width - 64;
    const w = g.measureText(s.name).width;
    if (w > max) size = Math.floor((size * max) / w);
    g.font = `800 ${size}px ${FONT}`;
    g.fillStyle = s.fg;
    g.fillText(s.name, c.width / 2, c.height / 2 + 6);
  } else {
    g.fillStyle = "rgba(255,255,255,0.14)";
    g.fill();
    g.setLineDash([20, 14]);
    g.lineWidth = 8;
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.stroke();
    g.fillStyle = "#ffffff";
    g.font = `800 84px ${FONT}`;
    g.fillText(price, c.width / 2, c.height / 2 + 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Side profile of a hatchback (x = length, y = height), extruded across the width.
function bodyShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.15, 0.3);
  s.lineTo(-1.8, 0.3);
  s.absarc(-1.35, 0.3, 0.45, Math.PI, 0, true);
  s.lineTo(0.9, 0.3);
  s.absarc(1.35, 0.3, 0.45, Math.PI, 0, true);
  s.lineTo(2.15, 0.3);
  s.lineTo(2.2, 0.72);
  s.quadraticCurveTo(2.18, 0.92, 1.95, 0.96);
  s.lineTo(1.0, 1.1);
  s.quadraticCurveTo(0.45, 1.5, 0.05, 1.55);
  s.lineTo(-1.6, 1.55);
  s.quadraticCurveTo(-1.85, 1.52, -2.02, 1.18);
  s.lineTo(-2.16, 0.98);
  s.closePath();
  return s;
}

function windowShape() {
  const s = new THREE.Shape();
  s.moveTo(0.92, 1.13);
  s.quadraticCurveTo(0.42, 1.44, 0.06, 1.47);
  s.lineTo(-1.58, 1.47);
  s.quadraticCurveTo(-1.78, 1.45, -1.93, 1.16);
  s.closePath();
  return s;
}

const HALF = 0.93; // half the body width including bevel

// Tile slots on each side, matching the car template zones:
// front wing (3), front door (4), rear door (4), rear wing (2). Front of the car is +x.
type Slot = { x: number; y: number; w: number; h: number };
const SLOTS: Slot[] = [
  { x: 1.98, y: 0.56, w: 0.3, h: 0.3 }, { x: 1.56, y: 0.88, w: 0.4, h: 0.19 }, { x: 1.13, y: 0.9, w: 0.4, h: 0.21 },
  { x: 0.67, y: 0.92, w: 0.38, h: 0.3 }, { x: 0.26, y: 0.92, w: 0.38, h: 0.3 }, { x: 0.67, y: 0.58, w: 0.38, h: 0.3 }, { x: 0.26, y: 0.58, w: 0.38, h: 0.3 },
  { x: -0.26, y: 0.92, w: 0.38, h: 0.3 }, { x: -0.67, y: 0.92, w: 0.38, h: 0.3 }, { x: -0.26, y: 0.58, w: 0.38, h: 0.3 }, { x: -0.67, y: 0.58, w: 0.38, h: 0.3 },
  { x: -1.13, y: 0.93, w: 0.4, h: 0.27 }, { x: -1.57, y: 0.93, w: 0.4, h: 0.27 },
];

function SideTiles({ side, sponsors }: { side: 1 | -1; sponsors: (Sponsor | null)[] }) {
  const textures = useMemo(() => SLOTS.map((slot, i) => logoTexture(sponsors[i] ?? null, "£40", slot.w / slot.h)), [sponsors]);
  return (
    <group position={[0, 0, side * (HALF + 0.006)]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
      {SLOTS.map((slot, i) => (
        <mesh key={i} position={[side * slot.x, slot.y, 0]}>
          <planeGeometry args={[slot.w, slot.h]} />
          <meshStandardMaterial map={textures[i]} transparent roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

/** Panel gaps, door handles and a wing mirror for one side. */
function SideDetail({ side }: { side: 1 | -1 }) {
  const z = side * (HALF + 0.002);
  return (
    <group>
      {[0.89, 0.02, -0.88].map((x) => (
        <mesh key={x} position={[x, 0.74, z]}><boxGeometry args={[0.014, 0.76, 0.004]} /><meshStandardMaterial color="#8f2a14" roughness={0.6} /></mesh>
      ))}
      {[0.14, -0.76].map((x) => (
        <mesh key={x} position={[x, 1.09, side * (HALF + 0.012)]}><boxGeometry args={[0.17, 0.035, 0.024]} /><meshStandardMaterial color="#1d1a16" roughness={0.4} /></mesh>
      ))}
      <mesh position={[0.84, 1.2, side * (HALF + 0.1)]} castShadow><boxGeometry args={[0.1, 0.11, 0.2]} /><meshPhysicalMaterial color="#ff5a36" roughness={0.3} clearcoat={1} /></mesh>
    </group>
  );
}

function Wheel({ x, z }: { x: number; z: number }) {
  const face = z > 0 ? 0.135 : -0.135;
  return (
    <group position={[x, 0.36, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.37, 0.37, 0.26, 48]} />
        <meshStandardMaterial color="#141414" roughness={0.9} />
      </mesh>
      <mesh position={[0, face, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.012, 40]} />
        <meshStandardMaterial color="#fff6e5" roughness={0.5} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, face * 1.05, 0]} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
          <boxGeometry args={[0.055, 0.012, 0.46]} />
          <meshStandardMaterial color="#1d1a16" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, face * 1.1, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.014, 24]} />
        <meshStandardMaterial color="#ffd23f" roughness={0.4} />
      </mesh>
    </group>
  );
}

type P2 = [number, number];

/** Glass that follows a curved edge of the profile (windscreen, rear glass), sitting just above the bodywork. */
function Pane({ from, ctrl, to, t0 = 0.08, t1 = 0.92 }: { from: P2; ctrl: P2; to: P2; t0?: number; t1?: number }) {
  const geo = useMemo(() => {
    const N = 16, lift = 0.068, hw = 0.76;
    const pos: number[] = [], idx: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = t0 + ((t1 - t0) * i) / N, u = 1 - t;
      const x = u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0];
      const y = u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1];
      const dx = 2 * u * (ctrl[0] - from[0]) + 2 * t * (to[0] - ctrl[0]);
      const dy = 2 * u * (ctrl[1] - from[1]) + 2 * t * (to[1] - ctrl[1]);
      const l = Math.hypot(dx, dy);
      const px = x + (dy / l) * lift, py = y + (-dx / l) * lift;
      pos.push(px, py, hw, px, py, -hw);
      if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [from, ctrl, to, t0, t1]);
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial color="#10141b" roughness={0.05} metalness={0.5} clearcoat={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

const SCREEN: P2[] = [[1.0, 1.1], [0.45, 1.5], [0.05, 1.55]];
const REAR: P2[] = [[-1.6, 1.55], [-1.85, 1.52], [-2.02, 1.18]];

function Car() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = -0.45 + Math.sin(clock.elapsedTime * 0.35) * 0.55;
  });
  const body = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(bodyShape(), { depth: 1.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 6, curveSegments: 32 });
    g.translate(0, 0, -0.85);
    return g;
  }, []);
  const glass = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(windowShape(), { depth: HALF * 2 + 0.01, bevelEnabled: false, curveSegments: 24 });
    g.translate(0, 0, -(HALF + 0.005));
    return g;
  }, []);
  const left = useMemo(() => [B.kite, null, B.fizz, B.nova, B.pulse, null, B.orbit, B.lumen, null, B.kite, B.nova, B.orbit, null], []);
  const right = useMemo(() => [null, B.orbit, B.lumen, B.pulse, null, B.kite, B.nova, B.fizz, B.orbit, null, B.lumen, null, B.pulse], []);
  return (
    <group ref={ref} position={[0.05, 0, 0]}>
      <mesh geometry={body} castShadow>
        <meshPhysicalMaterial color="#ff5a36" roughness={0.3} metalness={0.2} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <mesh geometry={glass}>
        <meshPhysicalMaterial color="#10141b" roughness={0.05} metalness={0.5} clearcoat={1} />
      </mesh>
      <Pane from={SCREEN[0]} ctrl={SCREEN[1]} to={SCREEN[2]} t1={0.8} />
      <Pane from={REAR[0]} ctrl={REAR[1]} to={REAR[2]} t0={0.25} />
      {[0.6, -0.6].map((z) => (
        <group key={z}>
          <mesh position={[2.27, 0.8, z]}><boxGeometry args={[0.04, 0.1, 0.36]} /><meshStandardMaterial color="#fff6d8" emissive="#fff1c2" emissiveIntensity={1.4} /></mesh>
          <mesh position={[-2.27, 0.9, z]}><boxGeometry args={[0.04, 0.09, 0.4]} /><meshStandardMaterial color="#d12b2b" emissive="#b01e1e" emissiveIntensity={0.9} /></mesh>
        </group>
      ))}
      {/* Bumpers, grille and number plates */}
      <mesh position={[2.19, 0.44, 0]} castShadow><boxGeometry args={[0.1, 0.2, 1.74]} /><meshStandardMaterial color="#1d1a16" roughness={0.6} /></mesh>
      <mesh position={[-2.17, 0.44, 0]} castShadow><boxGeometry args={[0.1, 0.2, 1.74]} /><meshStandardMaterial color="#1d1a16" roughness={0.6} /></mesh>
      <mesh position={[2.275, 0.64, 0]}><boxGeometry args={[0.03, 0.12, 0.7]} /><meshStandardMaterial color="#1d1a16" roughness={0.5} /></mesh>
      <mesh position={[2.25, 0.44, 0]}><boxGeometry args={[0.012, 0.11, 0.46]} /><meshStandardMaterial color="#ffd23f" roughness={0.5} /></mesh>
      <mesh position={[-2.23, 0.44, 0]}><boxGeometry args={[0.012, 0.11, 0.46]} /><meshStandardMaterial color="#ffd23f" roughness={0.5} /></mesh>
      <SideDetail side={1} />
      <SideDetail side={-1} />
      <SideTiles side={1} sponsors={left} />
      <SideTiles side={-1} sponsors={right} />
      <Wheel x={1.35} z={0.8} />
      <Wheel x={1.35} z={-0.8} />
      <Wheel x={-1.35} z={0.8} />
      <Wheel x={-1.35} z={-0.8} />
    </group>
  );
}

export default function CarScene() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [1.6, 1.9, 7.6], fov: 30 }} gl={{ antialias: true }}>
      <Environment resolution={256}>
        <Lightformer intensity={2.5} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer intensity={1.5} position={[0, 1, 6]} scale={[12, 1.2, 1]} />
        <Lightformer intensity={1} position={[-6, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer intensity={1} position={[6, 1, 0]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>
      <hemisphereLight args={["#ffffff", "#d9d6cf", 1.1]} />
      <directionalLight position={[5, 8, 4]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 3, -4]} intensity={0.8} />
      <group position={[0, -0.8, 0]}>
        <Car />
        <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={10} blur={2.4} far={3} />
      </group>
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0.9} maxPolarAngle={1.45} />
    </Canvas>
  );
}
