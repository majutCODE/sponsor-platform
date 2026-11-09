"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Sponsor = { name: string; bg: string; fg: string; font: string };

// Fictional example brands, shown only to illustrate sponsored tiles.
const SPONSORS: (Sponsor | null)[] = [
  { name: "NOVA", bg: "#111111", fg: "#ffffff", font: "800 100px 'Instrument Sans Variable', sans-serif" },
  null,
  { name: "pulse", bg: "#161512", fg: "#f6f3ec", font: "700 100px 'Instrument Sans Variable', sans-serif" },
  { name: "Orbit", bg: "#f6f3ec", fg: "#8b2c1c", font: "400 110px 'Instrument Serif', Georgia, serif" },
  null,
  { name: "KITE", bg: "#f6f3ec", fg: "#161512", font: "900 100px 'Instrument Sans Variable', sans-serif" },
  { name: "lumen", bg: "#ffffff", fg: "#111111", font: "600 100px 'Instrument Sans Variable', sans-serif" },
  null,
];

function logoTexture(s: Sponsor | null, price: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 192;
  const g = c.getContext("2d")!;
  if (s) {
    g.fillStyle = s.bg;
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = s.fg;
    g.font = s.font;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(s.name, c.width / 2, c.height / 2 + 4);
  } else {
    g.fillStyle = "rgba(255,255,255,0.08)";
    g.fillRect(0, 0, c.width, c.height);
    g.setLineDash([18, 14]);
    g.lineWidth = 6;
    g.strokeStyle = "rgba(255,255,255,0.75)";
    g.strokeRect(8, 8, c.width - 16, c.height - 16);
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.font = "600 76px 'Instrument Sans Variable', sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(price, c.width / 2, c.height / 2 + 2);
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

// Tile slots on each side: an upper band of four, a lower pair between the wheel arches.
const SLOTS = [
  { x: -1.4, y: 0.88, w: 0.86 }, { x: -0.47, y: 0.88, w: 0.86 }, { x: 0.47, y: 0.88, w: 0.86 }, { x: 1.4, y: 0.88, w: 0.86 },
  { x: -0.43, y: 0.6, w: 0.8 }, { x: 0.43, y: 0.6, w: 0.8 },
];

function SideTiles({ side, sponsors }: { side: 1 | -1; sponsors: (Sponsor | null)[] }) {
  const textures = useMemo(() => sponsors.map((s) => logoTexture(s, "£40")), [sponsors]);
  return (
    <group position={[0, 0, side * (HALF + 0.004)]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
      {SLOTS.map((slot, i) => (
        <mesh key={i} position={[side * slot.x, slot.y, 0]}>
          <planeGeometry args={[slot.w, 0.24]} />
          <meshStandardMaterial map={textures[i]} transparent roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.36, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.26, 40]} />
        <meshStandardMaterial color="#121212" roughness={0.85} />
      </mesh>
      <mesh position={[0, z > 0 ? 0.131 : -0.131, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.01, 32]} />
        <meshStandardMaterial color="#bfc3c9" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** A thin dark pane laid along a line of the profile (windscreen, rear glass). */
function Pane({ from, to }: { from: [number, number]; to: [number, number] }) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  const nx = dy / len, ny = -dx / len; // outward normal for a clockwise edge
  return (
    <mesh position={[(from[0] + to[0]) / 2 + nx * 0.012, (from[1] + to[1]) / 2 + ny * 0.012, 0]} rotation={[0, 0, Math.atan2(dy, dx)]}>
      <boxGeometry args={[len * 0.9, 0.01, 1.62]} />
      <meshPhysicalMaterial color="#10141b" roughness={0.05} metalness={0.5} clearcoat={1} />
    </mesh>
  );
}

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
  const left = useMemo(() => SPONSORS.slice(0, 6), []);
  const right = useMemo(() => [SPONSORS[6], SPONSORS[0], null, SPONSORS[2], SPONSORS[3], null], []);
  return (
    <group ref={ref} position={[0.05, 0, 0]}>
      <mesh geometry={body} castShadow>
        <meshPhysicalMaterial color="#8b2c1c" roughness={0.28} metalness={0.35} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <mesh geometry={glass}>
        <meshPhysicalMaterial color="#10141b" roughness={0.05} metalness={0.5} clearcoat={1} />
      </mesh>
      <Pane from={[1.0, 1.1]} to={[0.1, 1.54]} />
      <Pane from={[-1.62, 1.54]} to={[-2.02, 1.18]} />
      {[0.6, -0.6].map((z) => (
        <group key={z}>
          <mesh position={[2.2, 0.8, z]}><boxGeometry args={[0.04, 0.1, 0.36]} /><meshStandardMaterial color="#fff6d8" emissive="#fff1c2" emissiveIntensity={1.4} /></mesh>
          <mesh position={[-2.22, 0.94, z]}><boxGeometry args={[0.04, 0.09, 0.4]} /><meshStandardMaterial color="#d12b2b" emissive="#b01e1e" emissiveIntensity={0.9} /></mesh>
        </group>
      ))}
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
    <Canvas shadows dpr={[1, 2]} camera={{ position: [1.2, 1.45, 6.6], fov: 30 }} gl={{ antialias: true }}>
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
