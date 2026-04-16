import React, { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import Beanstalk, { getStalkPosition, waterDropRefs } from './Beanstalk'
import Bubble from './Bubble'
import FloatingParticles from './FloatingParticles'
import Effects from './Effects'
import { allDroplets } from '../data/portfolio'

/* ──────────────────────────────────────────────────────────────
   ScrollCamera — lives inside Canvas so it can use Three.js hooks
   ────────────────────────────────────────────────────────────── */
function ScrollCamera({ scrollProgress }) {
  const { camera } = useThree()
  const smooth     = useRef(0)
  const lookTarget = useRef(new THREE.Vector3())
  // Independently smoothed camera position — prevents jumps when drop focus changes
  const camPos     = useRef(new THREE.Vector3(12, 2, 12))
  // Per-drop data resolved lazily after the GLB mounts.
  // Each entry: { pos: Vector3, frontPos: Vector3, scrollT: number }
  const dropsData  = useRef([])

  useEffect(() => {
    camera.position.set(12, 2, 12)
    camera.lookAt(0, 6, 0)
  }, [camera])

  useFrame(() => {
    // Smooth scroll — gentle lag so fast swipes don't whip the camera
    smooth.current = THREE.MathUtils.lerp(smooth.current, scrollProgress, 0.03)
    const t = smooth.current

    /* Spiral path around the beanstalk
       t=0 → base looking up
       t=1 → top, in the clouds */
    const angle      = t * Math.PI * 2.8   // ~1.4 full orbits
    const baseRadius = 14 - t * 6          // 14 → 8 (closer to stalk)
    const height     = t * 64              // 0 → 64

    // Lazily resolve every waterdrop's world position once it's in the scene
    waterDropRefs.current.forEach((node, i) => {
      if (!dropsData.current[i]) {
        dropsData.current[i] = {
          pos: new THREE.Vector3(),
          frontPos: new THREE.Vector3(),
          scrollT: -1,
        }
      }
      const dd = dropsData.current[i]
      if (dd.scrollT < 0) {
        const wp = new THREE.Vector3()
        node.getWorldPosition(wp)
        if (wp.lengthSq() > 0.01) {
          dd.pos.copy(wp)
          // Direction from stalk origin → drop in XZ (outward from the beanstalk)
          const dx = wp.x, dz = wp.z
          const dLen = Math.sqrt(dx * dx + dz * dz) || 1
          // Place the front-on camera 7 units out from the drop along that direction
          dd.frontPos.set(
            wp.x + (dx / dLen) * 7,
            wp.y,
            wp.z + (dz / dLen) * 7
          )
          // Map the drop's Y (0–~70) into the same 0–1 scroll space as `height` (0–64)
          dd.scrollT = THREE.MathUtils.clamp(wp.y / 64, 0, 1)
        }
      }
    })

    // Weighted blend across ALL drops so there is never a hard winner-switch.
    // Each drop contributes based on a narrow (±10%) smoothstep proximity bell.
    // Dividing by totalWeight normalises the blend so the camera always moves
    // toward a single weighted-average target, not a sharp jump.
    const blendLook  = new THREE.Vector3()
    const blendFront = new THREE.Vector3()
    let totalWeight  = 0

    dropsData.current.forEach((dd) => {
      if (dd.scrollT < 0) return
      const raw = THREE.MathUtils.clamp(1 - Math.abs(t - dd.scrollT) / 0.10, 0, 1)
      const w   = raw * raw * (3 - 2 * raw) // smoothstep
      blendLook.addScaledVector(dd.pos, w)
      blendFront.addScaledVector(dd.frontPos, w)
      totalWeight += w
    })

    // prox: how strongly any drop is influencing right now (capped at 1)
    const prox = Math.min(1, totalWeight)

    if (totalWeight > 0) {
      blendLook.divideScalar(totalWeight)
      blendFront.divideScalar(totalWeight)
    }

    // Shrink orbit radius as we approach a drop
    const radius = baseRadius - prox * 4.5
    const orbitX = Math.sin(angle) * radius
    const orbitZ = Math.cos(angle) * radius

    // Desired camera position — blend between orbit and front-facing position
    const desiredX = THREE.MathUtils.lerp(orbitX,      blendFront.x, prox)
    const desiredY = THREE.MathUtils.lerp(height + 2,  blendFront.y, prox)
    const desiredZ = THREE.MathUtils.lerp(orbitZ,      blendFront.z, prox)

    // Smooth camera position independently — this is what eliminates jumps/rolls
    camPos.current.x = THREE.MathUtils.lerp(camPos.current.x, desiredX, 0.04)
    camPos.current.y = THREE.MathUtils.lerp(camPos.current.y, desiredY, 0.04)
    camPos.current.z = THREE.MathUtils.lerp(camPos.current.z, desiredZ, 0.04)
    camera.position.copy(camPos.current)

    // Smoothly blend look target toward the active drop (or stalk ahead)
    const tAhead    = Math.min(1, t + 0.04)
    const stalkAhead = getStalkPosition(tAhead)
    const defaultLook = new THREE.Vector3(stalkAhead.x, height + 9, stalkAhead.z)
    if (totalWeight > 0) defaultLook.lerp(blendLook, prox)

    lookTarget.current.lerp(defaultLook, 0.035)
    camera.lookAt(lookTarget.current)
  })

  return null
}

/* ──────────────────────────────────────────────────────────────
   CloudLayer
   ────────────────────────────────────────────────────────────── */
function CloudPuff({ position, scale = 1 }) {
  const puffs = React.useMemo(() => {
    return Array.from({ length: 8 }, () => ({
      pos: [
        (Math.random() - 0.5) * 10 * scale,
        (Math.random() - 0.5) * 2 * scale,
        (Math.random() - 0.5) * 6 * scale,
      ],
      s: (0.8 + Math.random() * 1.4) * scale,
    }))
  }, [scale])

  return (
    <group position={position}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.s}>
          <sphereGeometry args={[1.2, 5, 4]} />
          <meshStandardMaterial
            color="#eef8ff"
            transparent
            opacity={0.22}
            flatShading
            roughness={1}
            emissive="#c8e8ff"
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ──────────────────────────────────────────────────────────────
   Main Scene
   ────────────────────────────────────────────────────────────── */
export default function Scene({ scrollProgress }) {
  return (
    <>
      {/* ── Background & Fog ──────────────────────────────────── */}
      <color attach="background" args={['#a3c8de']} />
      <fog attach="fog" args={['#b8d8ea', 50, 160]} />

      {/* ── Lighting ─────────────────────────────────────────── */}
      <ambientLight intensity={0.35} color="#d8eeff" />

      {/* Key light — sunlight from above-right */}
      <directionalLight
        position={[8, 30, 10]}
        intensity={1.1}
        color="#ffffff"
        castShadow={false}
      />

      {/* Fill light — cool blue from left */}
      <directionalLight
        position={[-10, 15, -8]}
        intensity={0.38}
        color="#c0d8ff"
      />

      {/* Hemisphere sky/ground */}
      <hemisphereLight
        skyColor="#d0eeff"
        groundColor="#a8d8a8"
        intensity={0.32}
      />

      {/* Glowing point lights along the stalk */}
      <pointLight position={[1, 10, 1]} intensity={0.7} color="#b0ffcc" distance={22} decay={2} />
      <pointLight position={[-1, 25, 1]} intensity={0.6} color="#c8f0ff" distance={22} decay={2} />
      <pointLight position={[1, 42, -1]} intensity={0.6} color="#e0d8ff" distance={22} decay={2} />
      <pointLight position={[0, 60, 0]} intensity={0.8} color="#fff8c0" distance={30} decay={2} />

      {/* ── Camera driver ─────────────────────────────────────── */}
      <ScrollCamera scrollProgress={scrollProgress} />

      {/* ── Ground disc ──────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[18, 20]} />
        <meshStandardMaterial
          color="#6abf7a"
          flatShading
          roughness={1}
          emissive="#2a5a30"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* ── Beanstalk ─────────────────────────────────────────── */}
      <Beanstalk />

      {/* ── Bubbles ──────────────────────────────────────────── */}
      {allDroplets.map((d) => (
        <Bubble key={d.id} data={d} />
      ))}

      {/* ── Floating fairy particles ─────────────────────────── */}
      <FloatingParticles count={2200} />

      {/* ── Cloud layers ─────────────────────────────────────── */}
      <CloudPuff position={[-14, 44, -8]} scale={1.1} />
      <CloudPuff position={[12, 48, 6]} scale={0.9} />
      <CloudPuff position={[-6, 54, 12]} scale={1.2} />
      <CloudPuff position={[10, 58, -10]} scale={0.8} />
      <CloudPuff position={[0, 66, 0]} scale={1.4} />
      <CloudPuff position={[-12, 70, 4]} scale={1.0} />

      {/* ── Environment map (for glass/transmission realism) ──── */}
      <Environment preset="dawn" environmentIntensity={0.6} />

      {/* ── Post-processing ──────────────────────────────────── */}
      <Effects />
    </>
  )
}
