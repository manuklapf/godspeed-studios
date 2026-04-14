import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ──────────────────────────────────────────────────────────────
   FloatingParticles
   Creates two layers:
   1. Ambient fairy dust — thousands of small white specks
   2. Sparkle glints — fewer, larger, brighter points
   ────────────────────────────────────────────────────────────── */
export default function FloatingParticles({ count = 2200 }) {
  const dustRef = useRef()
  const sparkRef = useRef()

  /* ── Ambient dust positions in a tall cylinder ── */
  const dustPositions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 14
      arr[i * 3]     = Math.sin(angle) * radius
      arr[i * 3 + 1] = Math.random() * 75
      arr[i * 3 + 2] = Math.cos(angle) * radius
    }
    return arr
  }, [count])

  /* ── Sparkle positions — denser near the stalk ── */
  const sparkCount = Math.floor(count * 0.25)
  const sparkPositions = useMemo(() => {
    const arr = new Float32Array(sparkCount * 3)
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 0.8 + Math.random() * 6
      arr[i * 3]     = Math.sin(angle) * radius
      arr[i * 3 + 1] = Math.random() * 75
      arr[i * 3 + 2] = Math.cos(angle) * radius
    }
    return arr
  }, [sparkCount])

  /* ── Animate slow drift ── */
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (dustRef.current) {
      dustRef.current.rotation.y = t * 0.018
      dustRef.current.position.y = Math.sin(t * 0.08) * 0.3
    }
    if (sparkRef.current) {
      sparkRef.current.rotation.y = -t * 0.025
      // Pulse opacity
      const mat = sparkRef.current.material
      mat.opacity = 0.45 + Math.sin(t * 1.2) * 0.25
    }
  })

  return (
    <>
      {/* Ambient dust */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={dustPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          color="#d8f8ff"
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Sparkles */}
      <points ref={sparkRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={sparkCount}
            array={sparkPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.14}
          color="#ffffff"
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </>
  )
}
