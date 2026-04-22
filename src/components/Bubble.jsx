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
   Placeholder image texture shown on hover
   ────────────────────────────────────────────────────────────── */
function makeHoverPlaceholder(data) {
  const SIZE = 256
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')

  // Frosted glass background
  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  grad.addColorStop(0, (data.colorA || '#a8e6cf') + 'cc')
  grad.addColorStop(1, (data.colorB || '#3d8050') + '88')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Rounded image frame
  ctx.fillStyle = 'rgba(230,245,238,0.55)'
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(20, 20, SIZE - 40, SIZE - 40, 20)
  else ctx.rect(20, 20, SIZE - 40, SIZE - 40)
  ctx.fill()

  // Mountain / image icon
  const cx = SIZE / 2
  const cy = SIZE / 2
  // Sky circle
  ctx.fillStyle = 'rgba(120,190,160,0.5)'
  ctx.beginPath()
  ctx.arc(cx - 20, cy - 22, 18, 0, Math.PI * 2)
  ctx.fill()
  // Mountain silhouette
  ctx.fillStyle = 'rgba(60,120,80,0.6)'
  ctx.beginPath()
  ctx.moveTo(SIZE * 0.12, cy + 30)
  ctx.lineTo(cx - 12, cy - 20)
  ctx.lineTo(cx + 10, cy + 5)
  ctx.lineTo(cx + 22, cy - 12)
  ctx.lineTo(SIZE * 0.88, cy + 30)
  ctx.closePath()
  ctx.fill()
  // Snow cap
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.beginPath()
  ctx.moveTo(cx - 12, cy - 20)
  ctx.lineTo(cx - 23, cy - 5)
  ctx.lineTo(cx - 1, cy - 5)
  ctx.closePath()
  ctx.fill()

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
   Bubble
   ────────────────────────────────────────────────────────────── */
export default function Bubble({ data }) {
  const outerRef = useRef()
  const geoRef = useRef()
  const groupRef = useRef()
  const contentRef = useRef()
  const hoverImageRef = useRef()
  const tmpVec = useRef(new THREE.Vector3())
  const projVec = useRef(new THREE.Vector3())
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)

  const texture = useMemo(() => makeDropletTexture(data), [data])
  const hoverTexture = useMemo(() => makeHoverPlaceholder(data), [data])

  // Store original sphere vertex positions for blob deformation
  const origPositions = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.3, 28, 22)
    return new Float32Array(geo.attributes.position.array)
  }, [])

  const basePos = useMemo(() => {
    const sp = getStalkPosition(data.stalkT)
    return new THREE.Vector3(
      sp.x + (data.offsetX || 2.2),
      sp.y,
      sp.z + (data.offsetZ || 0)
    )
  }, [data])

  const phaseOffset = useMemo(() => data.stalkT * 17, [data.stalkT])

  useFrame(({ clock, pointer, camera }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    // Organic multi-axis water float
    const floatY = Math.sin(t * 0.42 + phaseOffset) * 0.22
               + Math.sin(t * 0.73 + phaseOffset * 0.5) * 0.09
    const floatX = Math.sin(t * 0.31 + phaseOffset * 1.3) * 0.07
    const floatZ = Math.cos(t * 0.37 + phaseOffset * 0.9) * 0.06
    groupRef.current.position.set(
      basePos.x + floatX,
      basePos.y + floatY,
      basePos.z + floatZ
    )
    // Surface-tension wobble rotations
    groupRef.current.rotation.y = Math.sin(t * 0.11 + phaseOffset) * 0.18
    groupRef.current.rotation.x = Math.sin(t * 0.22 + phaseOffset * 0.7) * 0.05
    groupRef.current.rotation.z = Math.sin(t * 0.29 + phaseOffset * 1.1) * 0.04

    // Cursor proximity deformation (screen-space squash/stretch)
    groupRef.current.getWorldPosition(tmpVec.current)
    projVec.current.copy(tmpVec.current).project(camera)
    const dx = pointer.x - projVec.current.x
    const dy = pointer.y - projVec.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const threshold = 0.45
    let tSX = 1.0, tSY = 1.0, tSZ = 1.0
    if (dist < threshold) {
      const strength = (1 - dist / threshold) * 0.55
      const angle = Math.atan2(dy, dx)
      const ax = Math.abs(Math.cos(angle))
      const ay = Math.abs(Math.sin(angle))
      tSX = 1 + ax * strength
      tSY = 1 + ay * strength
      tSZ = 1 / Math.sqrt(tSX * tSY)
    }
    groupRef.current.scale.set(
      THREE.MathUtils.lerp(groupRef.current.scale.x, tSX, 0.09),
      THREE.MathUtils.lerp(groupRef.current.scale.y, tSY, 0.09),
      THREE.MathUtils.lerp(groupRef.current.scale.z, tSZ, 0.09)
    )

    // Per-vertex blob deformation
    if (geoRef.current) {
      const pos = geoRef.current.attributes.position
      const count = pos.count
      for (let i = 0; i < count; i++) {
        const ox = origPositions[i * 3]
        const oy = origPositions[i * 3 + 1]
        const oz = origPositions[i * 3 + 2]
        const len = Math.sqrt(ox * ox + oy * oy + oz * oz)
        if (len === 0) continue
        const nx = ox / len
        const ny = oy / len
        const nz = oz / len
        const wave =
          Math.sin(t * 1.3 + ox * 2.2 + phaseOffset) * 0.11 +
          Math.sin(t * 0.85 + oy * 1.8 + phaseOffset * 0.6) * 0.09 +
          Math.sin(t * 1.6 + oz * 2.5 + phaseOffset * 1.2) * 0.07 +
          Math.sin(t * 0.55 + (ox + oz) * 1.4 + phaseOffset * 0.4) * 0.08
        pos.setXYZ(i, ox + nx * wave, oy + ny * wave, oz + nz * wave)
      }
      pos.needsUpdate = true
      geoRef.current.computeVertexNormals()
    }

    // Hover image fade in / out
    if (hoverImageRef.current) {
      const tOp = hovered ? 0.92 : 0
      hoverImageRef.current.material.opacity = THREE.MathUtils.lerp(
        hoverImageRef.current.material.opacity, tOp, 0.07
      )
    }
    // Content text fade out on hover
    if (contentRef.current) {
      const tOp = hovered ? 0.18 : 0.92
      contentRef.current.material.opacity = THREE.MathUtils.lerp(
        contentRef.current.material.opacity, tOp, 0.07
      )
    }
  })

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    setOpen((o) => !o)
  }, [])

  // Droplet glass tint based on type
  const glassColor = data.type === 'reference' ? '#d8e8ff' : '#c8f4e0'

  return null

  return (
    <group
      ref={groupRef}
      position={[basePos.x, basePos.y, basePos.z]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Glass outer sphere — deformable blob */}
      <mesh ref={outerRef}>
        <sphereGeometry ref={geoRef} args={[1.3, 28, 22]} />
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
      <mesh ref={contentRef} position={[0, 0, 0.15]} renderOrder={2}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial
          map={texture}
          side={THREE.FrontSide}
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </mesh>

      {/* Hover placeholder image — fades in on hover */}
      <mesh ref={hoverImageRef} position={[0, 0, 0.17]} renderOrder={3}>
        <planeGeometry args={[1.05, 1.05]} />
        <meshBasicMaterial
          map={hoverTexture}
          side={THREE.FrontSide}
          transparent
          opacity={0}
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

      {/* Info card overlay */}
      {open && (
        <InfoCard data={data} onClose={(e) => { setOpen(false) }} />
      )}
    </group>
  )
}
