import React, { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import Beanstalk, { getStalkPosition } from './Beanstalk'
import WaterDroplet from './WaterDroplet'
import FloatingParticles from './FloatingParticles'
import Effects from './Effects'
import { allDroplets } from '../data/portfolio'

/* ──────────────────────────────────────────────────────────────
   ScrollCamera — lives inside Canvas so it can use Three.js hooks
   ────────────────────────────────────────────────────────────── */
function ScrollCamera({ scrollProgress }) {
  const { camera } = useThree()
  const smooth = useRef(0)
  const lookTarget = useRef(new THREE.Vector3())

  useEffect(() => {
    camera.position.set(12, 2, 12)
    camera.lookAt(0, 6, 0)
  }, [camera])

  useFrame(() => {
    // Smooth scroll with gentle lag
    smooth.current = THREE.MathUtils.lerp(smooth.current, scrollProgress, 0.04)
    const t = smooth.current

    /* Spiral path around the beanstalk
       t=0 → base looking up
       t=1 → top, in the clouds */
    const angle = t * Math.PI * 2.8        // ~1.4 full orbits
    const radius = 14 - t * 6             // 14 → 8 (closer to stalk)
    const height = t * 64                 // 0 → 64

    camera.position.x = Math.sin(angle) * radius
    camera.position.y = height + 2
    camera.position.z = Math.cos(angle) * radius

    // Look slightly ahead along the stalk
    const tAhead = Math.min(1, t + 0.04)
    const stalkAhead = getStalkPosition(tAhead)
    lookTarget.current.lerp(
      new THREE.Vector3(stalkAhead.x, height + 9, stalkAhead.z),
      0.06
    )
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
      <color attach="background" args={['#bbd8ee']} />
      <fog attach="fog" args={['#cce8f4', 40, 180]} />

      {/* ── Lighting ─────────────────────────────────────────── */}
      <ambientLight intensity={0.55} color="#d8eeff" />

      {/* Key light — sunlight from above-right */}
      <directionalLight
        position={[8, 30, 10]}
        intensity={1.8}
        color="#ffffff"
        castShadow={false}
      />

      {/* Fill light — cool blue from left */}
      <directionalLight
        position={[-10, 15, -8]}
        intensity={0.6}
        color="#c0d8ff"
      />

      {/* Hemisphere sky/ground */}
      <hemisphereLight
        skyColor="#d0eeff"
        groundColor="#a8d8a8"
        intensity={0.5}
      />

      {/* Glowing point lights along the stalk */}
      <pointLight position={[1, 10, 1]} intensity={1.2} color="#b0ffcc" distance={22} decay={2} />
      <pointLight position={[-1, 25, 1]} intensity={1.0} color="#c8f0ff" distance={22} decay={2} />
      <pointLight position={[1, 42, -1]} intensity={1.0} color="#e0d8ff" distance={22} decay={2} />
      <pointLight position={[0, 60, 0]} intensity={1.4} color="#fff8c0" distance={30} decay={2} />

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

      {/* ── Water droplets ───────────────────────────────────── */}
      {allDroplets.map((d) => (
        <WaterDroplet key={d.id} data={d} />
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
      <Environment preset="dawn" />

      {/* ── Post-processing ──────────────────────────────────── */}
      <Effects />
    </>
  )
}
