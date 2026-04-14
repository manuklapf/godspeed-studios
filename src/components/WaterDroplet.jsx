import React, { useRef, useState, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { getStalkPosition } from './Beanstalk'

/* ──────────────────────────────────────────────────────────────
   Generate a canvas texture for the inside of the droplet
   ────────────────────────────────────────────────────────────── */
function makeDropletTexture(data) {
  const SIZE = 256
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')

  // Background radial gradient
  const grad = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 10, SIZE / 2, SIZE / 2, SIZE / 2)
  grad.addColorStop(0, data.colorA || '#a8e6cf')
  grad.addColorStop(1, data.colorB || '#3d8050')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Frosted image area (placeholder frame)
  ctx.fillStyle = 'rgba(255,255,255,0.30)'
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(28, 24, SIZE - 56, 110, 10)
  } else {
    ctx.rect(28, 24, SIZE - 56, 110)
  }
  ctx.fill()

  // Tag
  ctx.fillStyle = 'rgba(30,70,50,0.7)'
  ctx.font = `500 11px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.letterSpacing = '2px'
  ctx.fillText((data.tag || '').toUpperCase(), SIZE / 2, 50)

  // Title
  ctx.fillStyle = '#0e2a1a'
  ctx.font = `bold 18px -apple-system, system-ui, sans-serif`
  const words = data.title.split(' ')
  let line = ''
  let y = 84
  words.forEach((word) => {
    const test = line + word + ' '
    if (ctx.measureText(test).width > SIZE - 40 && line !== '') {
      ctx.fillText(line.trim(), SIZE / 2, y)
      line = word + ' '
      y += 22
    } else {
      line = test
    }
  })
  ctx.fillText(line.trim(), SIZE / 2, y)

  // Year badge
  if (data.year) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.beginPath()
    ctx.roundRect
      ? ctx.roundRect(SIZE / 2 - 20, SIZE - 52, 40, 20, 10)
      : ctx.rect(SIZE / 2 - 20, SIZE - 52, 40, 20)
    ctx.fill()
    ctx.fillStyle = '#1a3a28'
    ctx.font = `600 11px -apple-system, system-ui, sans-serif`
    ctx.fillText(data.year, SIZE / 2, SIZE - 37)
  }

  return new THREE.CanvasTexture(canvas)
}

/* ──────────────────────────────────────────────────────────────
   InfoCard — HTML overlay rendered via drei's Html portal
   ────────────────────────────────────────────────────────────── */
function InfoCard({ data, onClose }) {
  const isRef = data.type === 'reference'
  return (
    <Html
      center
      distanceFactor={9}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'all' }}
    >
      <div className={`droplet-card-wrapper`}>
        <div className={`droplet-card${isRef ? ' reference' : ''}`}>
          <button className="close-btn" onClick={onClose}>✕</button>
          <span className="card-tag">{data.tag}</span>
          <h3>{data.title}</h3>
          {data.subtitle && <p className="card-role">{data.subtitle}</p>}
          <p>{data.description}</p>
          {data.link && (
            <a href={data.link} target="_blank" rel="noopener noreferrer">
              {isRef ? 'View profile →' : 'View project →'}
            </a>
          )}
        </div>
      </div>
    </Html>
  )
}

/* ──────────────────────────────────────────────────────────────
   WaterDroplet
   ────────────────────────────────────────────────────────────── */
export default function WaterDroplet({ data }) {
  const outerRef = useRef()
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)

  // Canvas texture for inner image plane
  const texture = useMemo(() => makeDropletTexture(data), [data])

  // World position from stalk + lateral offset
  const basePos = useMemo(() => {
    const sp = getStalkPosition(data.stalkT)
    return new THREE.Vector3(
      sp.x + (data.offsetX || 2.2),
      sp.y,
      sp.z + (data.offsetZ || 0)
    )
  }, [data])

  // Phase offset for bobbing so droplets don't sync
  const phaseOffset = useMemo(() => data.stalkT * 17, [data.stalkT])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    // Gentle bob
    groupRef.current.position.y = basePos.y + Math.sin(t * 0.45 + phaseOffset) * 0.18
    // Slow self-rotation
    groupRef.current.rotation.y = t * 0.12 + phaseOffset
    // Pulse scale on hover
    const targetScale = hovered ? 1.12 : 1.0
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.10)
    )
  })

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    setOpen((o) => !o)
  }, [])

  // Droplet glass tint based on type
  const glassColor = data.type === 'reference' ? '#d8e8ff' : '#c8f4e0'

  return (
    <group
      ref={groupRef}
      position={[basePos.x, basePos.y, basePos.z]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Glass outer sphere */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[1.3, 18, 18]} />
        <meshPhysicalMaterial
          color={glassColor}
          roughness={0}
          metalness={0}
          transmission={0.92}
          thickness={1.6}
          ior={1.38}
          envMapIntensity={0.9}
          transparent
          opacity={0.88}
          emissive={glassColor}
          emissiveIntensity={0.06}
        />
      </mesh>

      {/* Inner content plane (canvas texture) */}
      <mesh position={[0, 0, 0]} renderOrder={2}>
        <planeGeometry args={[1.7, 1.7]} />
        <meshBasicMaterial
          map={texture}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </mesh>

      {/* Highlight rim — tiny bright sphere at top */}
      <mesh position={[0.45, 0.55, 0.9]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={2.5}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Thin wire ring around equator for the "leaf droplet" look */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.31, 0.024, 4, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.8}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Info card overlay */}
      {open && (
        <InfoCard data={data} onClose={(e) => { setOpen(false) }} />
      )}
    </group>
  )
}
