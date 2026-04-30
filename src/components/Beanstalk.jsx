import React, { Component, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { allDroplets } from '../data/portfolio'

/* ──────────────────────────────────────────────────────────────
   Shared click signal — read by ScrollCamera in Scene.jsx
   ────────────────────────────────────────────────────────────── */
export const dropClickBus = {
  active: false,
  targetPos: null, // THREE.Vector3 of the clicked drop's world position
}

/* ──────────────────────────────────────────────────────────────
   Stalk curve definition (exported so ScrollCamera can query it)
   ────────────────────────────────────────────────────────────── */
function buildStalkCurve() {
  const pts = []
  const N = 80
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const y = t * 70
    // Gentle organic S-sway — more pronounced in the middle
    const x =  Math.sin(t * Math.PI * 3.0) * 0.9 * Math.sin(t * Math.PI)
    const z =  Math.cos(t * Math.PI * 2.2) * 0.55 * Math.sin(t * Math.PI)
    pts.push(new THREE.Vector3(x, y, z))
  }
  return new THREE.CatmullRomCurve3(pts)
}

export const stalkCurve = buildStalkCurve()

/** Get a world-space position along the stalk (t ∈ [0,1]) */
export function getStalkPosition(t) {
  return stalkCurve.getPoint(Math.max(0, Math.min(1, t)))
}

/* ──────────────────────────────────────────────────────────────
   Apply ethereal flat-shaded materials to all meshes in the GLB
   ────────────────────────────────────────────────────────────── */
// Lazily created once and shared across all chain meshes
let _rustMat = null
function getRustMaterial() {
  if (_rustMat) return _rustMat
  const { colorTex, roughnessTex } = makeRustTextures()
  for (const t of [colorTex, roughnessTex]) {
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2, 2)
  }
  _rustMat = new THREE.MeshStandardMaterial({
    map: colorTex,
    roughnessMap: roughnessTex,
    // No metalnessMap — the whole surface is iron, rust included
    color: '#6a5a46',    // warm iron-grey; lightened so shine reads clearly
    roughness: 0.18,     // very low base; rust patches override via roughnessMap
    metalness: 1.0,      // fully metallic across the entire surface
    envMapIntensity: 2.8,// strong env reflections for a mirror-like sheen on links
  })
  return _rustMat
}

function applyEtherealMaterials(root) {
  root.traverse((node) => {
    if (!node.isMesh) return
    const name = (node.name || '').toLowerCase().replace(/[\s_-]/g, '')
    // Log mesh names once so we can confirm the chain mesh name
    if (import.meta.env.DEV) console.log('[GLB mesh]', node.name)
    const isChain     = /chain|link|ring/.test(name)
    const isLeaf      = /leaf|leave|folia|blade/.test(name)
    const isStalk     = /stalk|stem|vine|trunk|branch/.test(name)
    const isWaterDrop = /waterdrop/.test(name)

    // Rebuild geometry as non-indexed so flatShading is crisp
    if (node.geometry) {
      node.geometry = node.geometry.toNonIndexed()
      node.geometry.computeVertexNormals()
    }

    if (isChain) {
      node.material = getRustMaterial()
    } else if (isWaterDrop) {
      node.userData.origPositions = new Float32Array(
        node.geometry.attributes.position.array
      )
      node.material = new THREE.MeshPhysicalMaterial({
        color: '#c8f4e0',
        roughness: 0,
        metalness: 0,
        transmission: 0.92,
        thickness: 1.6,
        ior: 1.38,
        envMapIntensity: 0.9,
        transparent: true,
        opacity: 0.88,
        emissive: '#c8f4e0',
        emissiveIntensity: 0.06,
      })
    } else if (isLeaf) {
      node.material = new THREE.MeshStandardMaterial({
        color: '#6abf85',
        flatShading: true,
        roughness: 0.75,
        emissive: '#3d8050',
        emissiveIntensity: 0.14,
        side: THREE.DoubleSide,
      })
    } else if (isStalk) {
      node.material = new THREE.MeshStandardMaterial({
        color: '#3d8050',
        flatShading: true,
        roughness: 0.85,
        metalness: 0.04,
        emissive: '#1a3a28',
        emissiveIntensity: 0.18,
      })
    } else {
      node.material = new THREE.MeshStandardMaterial({
        color: '#7ed49a',
        flatShading: true,
        roughness: 0.8,
        emissive: '#2a6040',
        emissiveIntensity: 0.12,
        side: THREE.DoubleSide,
      })
    }
  })
}

/* ──────────────────────────────────────────────────────────────
   Scale the cloned scene so its tallest axis ≈ targetHeight units
   and centre the base at the origin
   ────────────────────────────────────────────────────────────── */
function fitToHeight(root, targetHeight = 70) {
  const box  = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  box.getSize(size)
  const tallest = Math.max(size.x, size.y, size.z)
  const s = tallest > 0 ? targetHeight / tallest : 1
  root.scale.setScalar(s)

  // Re-compute after scale
  const box2 = new THREE.Box3().setFromObject(root)
  root.position.x -= (box2.min.x + box2.max.x) / 2
  root.position.y -= box2.min.y
  root.position.z -= (box2.min.z + box2.max.z) / 2
}

/* ──────────────────────────────────────────────────────────────
   Leaf-sway hook — animates every leaf mesh in the GLB scene
   ────────────────────────────────────────────────────────────── */
function useLeafSway(root) {
  const leafNodes = useRef([])

  useEffect(() => {
    if (!root) return
    const nodes = []
    root.traverse((node) => {
      if (!node.isMesh) return
      const name = (node.name || '').toLowerCase()
      if (/leaf|leave|folia|blade/.test(name)) {
        node.userData.baseRotZ = node.rotation.z
        node.userData.phase    = Math.random() * Math.PI * 2
        nodes.push(node)
      }
    })
    leafNodes.current = nodes
  }, [root])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    leafNodes.current.forEach((node) => {
      node.rotation.z =
        node.userData.baseRotZ +
        Math.sin(t * 0.45 + node.userData.phase) * 0.045
    })
  })
}



/* ──────────────────────────────────────────────────────────────
   WaterDrop animation hook — blob deformation + subtle wobble
   Mirrors the effects applied to the floating Bubble spheres
   ────────────────────────────────────────────────────────────── */
/* Shared ref so ScrollCamera can find all GLB WaterDrop meshes in world space */
export const waterDropRefs = { current: [] }

function useWaterDropAnimation(root) {
  const dropNodes = useRef([])

  useEffect(() => {
    if (!root) return
    const nodes = []
    root.traverse((node) => {
      if (!node.isMesh) return
      const name = (node.name || '').toLowerCase().replace(/[\s_-]/g, '')
      if (!/waterdrop/.test(name)) return

      node.userData.phase        = Math.random() * Math.PI * 2
      node.userData.basePosition = node.position.clone()
      node.userData.scale        = new THREE.Vector3(1, 1, 1)
      node.userData.tmpVec       = new THREE.Vector3()
      node.userData.projVec      = new THREE.Vector3()
      // Assign portfolio data by drop index
      node.userData.dropData     = allDroplets[nodes.length % allDroplets.length]

      // Store the lowest local-space Y so we can clamp to the leaf surface
      if (node.userData.origPositions) {
        let minY = Infinity
        const op = node.userData.origPositions
        for (let i = 0; i < op.length / 3; i++) {
          if (op[i * 3 + 1] < minY) minY = op[i * 3 + 1]
        }
        node.userData.contactY = minY
      }

      nodes.push(node)
    })
    waterDropRefs.current = nodes
    dropNodes.current = nodes
  }, [root])

  useFrame(({ clock, pointer, camera }) => {
    const t = clock.elapsedTime
    dropNodes.current.forEach((node) => {
      const phase   = node.userData.phase || 0
      const base    = node.userData.basePosition
      const scl     = node.userData.scale
      const tmpVec  = node.userData.tmpVec
      const projVec = node.userData.projVec

      // Only float upward (never sink into the leaf)
      // Minimum offset of 0.004 ensures the base never touches the leaf
      const floatUp = 0.004 + Math.abs(Math.sin(t * 0.42 + phase)) * 0.008
      node.position.y = base.y + floatUp
      node.position.x = base.x
        + Math.sin(t * 0.31 + phase * 1.3) * 0.003
      node.position.z = base.z
        + Math.cos(t * 0.37 + phase * 0.9) * 0.003

      // Only rotate around Y — tilting X/Z would dip the base through the leaf
      node.rotation.y = Math.sin(t * 0.11 + phase) * 0.18
      node.rotation.x = 0
      node.rotation.z = 0

      // Cursor proximity squash/stretch (screen-space, same as Bubble)
      if (scl && tmpVec && projVec) {
        node.getWorldPosition(tmpVec)
        projVec.copy(tmpVec).project(camera)
        const cdx = pointer.x - projVec.x
        const cdy = pointer.y - projVec.y
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy)
        const threshold = 0.45
        let tSX = 1.0, tSY = 1.0, tSZ = 1.0
        if (cdist < threshold) {
          const strength = (1 - cdist / threshold) * 0.55
          const ang = Math.atan2(cdy, cdx)
          const ax = Math.abs(Math.cos(ang))
          const ay = Math.abs(Math.sin(ang))
          tSX = 1 + ax * strength
          tSY = 1 + ay * strength
          tSZ = 1 / Math.sqrt(tSX * tSY)
        }
        // Only allow upward stretch (tSY >= 1) to avoid pushing base into the leaf
        scl.x = THREE.MathUtils.lerp(scl.x, tSX, 0.09)
        scl.y = THREE.MathUtils.lerp(scl.y, Math.max(1.0, tSY), 0.09)
        scl.z = THREE.MathUtils.lerp(scl.z, tSZ, 0.09)
        node.scale.set(scl.x, scl.y, scl.z)
      }

    })
  })
}

/* ──────────────────────────────────────────────────────────────
   WaterDropHoverOverlay — speech bubble above hovered GLB drops
   ────────────────────────────────────────────────────────────── */
function WaterDropHoverOverlay() {
  const groupRef = useRef()
  const [hoveredData, setHoveredData] = useState(null)
  const { raycaster, pointer, gl } = useThree()
  const prevHovered = useRef(null)
  const tmpPos = useRef(new THREE.Vector3())
  const sphere = useRef(new THREE.Sphere())

  // Click listener — fires zoom + white fade when a drop is clicked
  useEffect(() => {
    const handleClick = () => {
      if (!prevHovered.current) return
      const wp = new THREE.Vector3()
      prevHovered.current.getWorldPosition(wp)
      dropClickBus.active = true
      dropClickBus.targetPos = wp.clone()
      window.dispatchEvent(new CustomEvent('dropletclick', { detail: { data: prevHovered.current.userData.dropData } }))
    }
    gl.domElement.addEventListener('click', handleClick)
    return () => gl.domElement.removeEventListener('click', handleClick)
  }, [gl])

  useFrame(({ camera }) => {
    if (waterDropRefs.current.length === 0) return

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(waterDropRefs.current, false)
    const hit = intersects.length > 0 ? intersects[0].object : null

    if (hit !== prevHovered.current) {
      prevHovered.current = hit
      document.body.style.cursor = hit ? 'pointer' : 'auto'
      setHoveredData(hit ? (hit.userData.dropData || null) : null)
    }

    if (hit && groupRef.current) {
      // Compute world-space bounding sphere to position bubble cleanly above the top
      hit.geometry.computeBoundingSphere()
      sphere.current.copy(hit.geometry.boundingSphere)
      sphere.current.applyMatrix4(hit.matrixWorld)
      groupRef.current.position.set(
        sphere.current.center.x,
        sphere.current.center.y + sphere.current.radius + 0.35,
        sphere.current.center.z
      )
    }
  })

  return (
    <group ref={groupRef} position={[0, -1000, 0]}>
      {hoveredData && (
        <Html center distanceFactor={9} zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
          <div className="speech-bubble">
            <span className="speech-bubble-tag">{hoveredData.tag}</span>
            <strong className="speech-bubble-title">{hoveredData.bubbleLabel || hoveredData.title}</strong>
            {hoveredData.year && (
              <span className="speech-bubble-year">{hoveredData.year}</span>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

/* ──────────────────────────────────────────────────────────────
   ProceduralBeanstalk — used as fallback while GLB is absent
   ────────────────────────────────────────────────────────────── */
function buildVineCurve() {
  const pts = []
  const N = 120
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const base = stalkCurve.getPoint(t)
    const angle = t * Math.PI * 9
    const r = 0.55 - t * 0.15
    pts.push(new THREE.Vector3(
      base.x + Math.sin(angle) * r,
      base.y,
      base.z + Math.cos(angle) * r
    ))
  }
  return new THREE.CatmullRomCurve3(pts)
}

/* ──────────────────────────────────────────────────────────────
   Rust canvas texture — dark iron base with orange-brown patches
   ────────────────────────────────────────────────────────────── */
/**
 * Returns { colorTex, roughnessTex } for old rusted metal.
 * roughnessTex: bright = rough (rust), dark = smooth (bare metal)
 */
function makeRustTextures() {
  const SIZE = 256
  // ── Colour map ──────────────────────────────────────────────
  const cCanvas = document.createElement('canvas')
  cCanvas.width = SIZE ; cCanvas.height = SIZE
  const cc = cCanvas.getContext('2d')

  // Bare dark iron base — slightly blue-grey to read metallic
  cc.fillStyle = '#28231e'
  cc.fillRect(0, 0, SIZE, SIZE)

  // Large rust patches
  const rustHues = ['#7a2e0c', '#8c3a14', '#a04822', '#6b2208', '#b85030', '#5a1c08', '#c05828']
  for (let i = 0; i < 32; i++) {
    const x = Math.random() * SIZE, y = Math.random() * SIZE
    const r = 12 + Math.random() * 40
    const c = rustHues[Math.floor(Math.random() * rustHues.length)]
    const g = cc.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0,    c + 'dd')
    g.addColorStop(0.5,  c + '99')
    g.addColorStop(1,    c + '00')
    cc.fillStyle = g
    cc.beginPath() ; cc.arc(x, y, r, 0, Math.PI * 2) ; cc.fill()
  }

  // Fine rust specks
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * SIZE, y = Math.random() * SIZE
    const r = 1 + Math.random() * 3
    cc.fillStyle = `rgba(${160 + (Math.random()*40|0)},${40+(Math.random()*30|0)},${6+(Math.random()*14|0)},${0.7+Math.random()*0.3})`
    cc.beginPath() ; cc.arc(x, y, r, 0, Math.PI * 2) ; cc.fill()
  }

  // Polished wear zones — bright iron showing through
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * SIZE, y = Math.random() * SIZE
    const r = 5 + Math.random() * 18
    const g = cc.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0,   'rgba(145,130,115,0.75)')
    g.addColorStop(0.5, 'rgba(110,100,90,0.4)')
    g.addColorStop(1,   'rgba(110,100,90,0)')
    cc.fillStyle = g
    cc.beginPath() ; cc.arc(x, y, r, 0, Math.PI * 2) ; cc.fill()
  }

  // Scratches
  cc.strokeStyle = 'rgba(160,145,130,0.35)'
  for (let i = 0; i < 24; i++) {
    cc.lineWidth = 0.5 + Math.random() * 1.2
    const x1 = Math.random()*SIZE, y1 = Math.random()*SIZE
    const len = 10 + Math.random()*60, ang = Math.random()*Math.PI
    cc.beginPath()
    cc.moveTo(x1, y1)
    cc.lineTo(x1 + Math.cos(ang)*len, y1 + Math.sin(ang)*len)
    cc.stroke()
  }

  // ── Roughness map ───────────────────────────────────────────
  // White = rough (rust/pits), Black = smooth (polished metal)
  const rCanvas = document.createElement('canvas')
  rCanvas.width = SIZE ; rCanvas.height = SIZE
  const rc = rCanvas.getContext('2d')

  // Start smooth — bare polished iron (dark = low roughness = shiny)
  rc.fillStyle = '#1a1a1a'
  rc.fillRect(0, 0, SIZE, SIZE)

  // Rust / pitted patches → rough (bright)
  for (let i = 0; i < 22; i++) {
    const x = Math.random() * SIZE, y = Math.random() * SIZE
    const r = 8 + Math.random() * 28
    const v = 170 + (Math.random() * 70 | 0)
    const g = rc.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0,   `rgba(${v},${v},${v},0.95)`)
    g.addColorStop(0.55,`rgba(${v},${v},${v},0.55)`)
    g.addColorStop(1,   `rgba(${v},${v},${v},0)`)
    rc.fillStyle = g
    rc.beginPath() ; rc.arc(x, y, r, 0, Math.PI * 2) ; rc.fill()
  }

  // Micro-pits / scratches → slightly rough streaks
  rc.strokeStyle = 'rgba(90,90,90,0.5)'
  for (let i = 0; i < 20; i++) {
    rc.lineWidth = 1 + Math.random() * 2
    const x1 = Math.random()*SIZE, y1 = Math.random()*SIZE
    const len = 8 + Math.random()*40, ang = Math.random()*Math.PI
    rc.beginPath()
    rc.moveTo(x1, y1)
    rc.lineTo(x1 + Math.cos(ang)*len, y1 + Math.sin(ang)*len)
    rc.stroke()
  }

  const colorTex     = new THREE.CanvasTexture(cCanvas)
  const roughnessTex = new THREE.CanvasTexture(rCanvas)
  return { colorTex, roughnessTex }
}

/** @deprecated — kept for ChainAlongStalk torus fallback */
function makeRustTexture() { return makeRustTextures().colorTex }

/* ──────────────────────────────────────────────────────────────
   Build chain link data — positions + quaternions along stalk
   Adjacent links alternate 90° so they appear interlocked
   ────────────────────────────────────────────────────────────── */
function buildChainLinks(numLinks = 72) {
  const links = []
  const Z  = new THREE.Vector3(0, 0, 1)
  const UP = new THREE.Vector3(0, 1, 0)

  for (let i = 0; i < numLinks; i++) {
    const t   = i / (numLinks - 1)
    const pos = stalkCurve.getPoint(t)
    const tan = stalkCurve.getTangent(t).normalize()

    // Normal perpendicular to tangent — fall back to X when tan ≈ UP
    let normal = new THREE.Vector3().crossVectors(tan, UP)
    if (normal.lengthSq() < 0.01) normal.set(1, 0, 0)
    normal.normalize()
    const binormal = new THREE.Vector3().crossVectors(tan, normal).normalize()

    // Hole axis: alternates between normal and binormal to simulate interlocking
    const holeAxis = i % 2 === 0 ? normal : binormal
    const quat = new THREE.Quaternion().setFromUnitVectors(Z, holeAxis)

    // Hang ~0.55 units outward from the stalk centre
    links.push({
      pos: new THREE.Vector3(
        pos.x + normal.x * 0.55,
        pos.y + normal.y * 0.55,
        pos.z + normal.z * 0.55
      ),
      quat: quat.clone(),
    })
  }
  return links
}

/* ──────────────────────────────────────────────────────────────
   ChainAlongStalk — rusted interlocked chain running up the stalk
   ────────────────────────────────────────────────────────────── */
function ChainAlongStalk() {
  const links = useMemo(() => buildChainLinks(72), [])
  const material = useMemo(() => getRustMaterial(), [])

  return (
    <group>
      {links.map((link, i) => (
        <mesh key={i} position={link.pos} quaternion={link.quat} material={material}>
          <torusGeometry args={[0.24, 0.065, 8, 16]} />
        </mesh>
      ))}
    </group>
  )
}

export function ProceduralBeanstalk() {
  const stalkGeo = useMemo(
    () => new THREE.TubeGeometry(stalkCurve, 80, 0.38, 5, false), []
  )
  const vineGeo = useMemo(() => {
    const vc = buildVineCurve()
    return new THREE.TubeGeometry(vc, 120, 0.10, 4, false)
  }, [])

  return (
    <group>
      <mesh geometry={stalkGeo}>
        <meshStandardMaterial color="#3d8050" flatShading roughness={0.85} metalness={0.05} emissive="#1a3a28" emissiveIntensity={0.18} />
      </mesh>
      <mesh geometry={vineGeo}>
        <meshStandardMaterial color="#5aad72" flatShading roughness={0.9} emissive="#2a5a38" emissiveIntensity={0.1} />
      </mesh>
      <ChainAlongStalk />
    </group>
  )
}

/* ──────────────────────────────────────────────────────────────
   GLBBeanstalk — loads the real model (throws if file missing)
   ────────────────────────────────────────────────────────────── */
function GLBBeanstalk() {
  const { scene } = useGLTF('/beanstalk.glb')

  const processedScene = useMemo(() => {
    const clone = scene.clone(true)
    fitToHeight(clone, 70)
    applyEtherealMaterials(clone)
    return clone
  }, [scene])

  useLeafSway(processedScene)
  useWaterDropAnimation(processedScene)

  return (
    <>
      <primitive object={processedScene} />
      <WaterDropHoverOverlay />
    </>
  )
}

/* ──────────────────────────────────────────────────────────────
   Error boundary — renders ProceduralBeanstalk when GLB fails
   ────────────────────────────────────────────────────────────── */
class BeanstalkErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: false }
  }
  static getDerivedStateFromError() {
    return { error: true }
  }
  render() {
    if (this.state.error) return <ProceduralBeanstalk />
    return this.props.children
  }
}

/* ──────────────────────────────────────────────────────────────
   Main export — tries GLB, falls back to procedural seamlessly
   ────────────────────────────────────────────────────────────── */
export default function Beanstalk() {
  return (
    <BeanstalkErrorBoundary>
      <React.Suspense fallback={<ProceduralBeanstalk />}>
        <GLBBeanstalk />
      </React.Suspense>
    </BeanstalkErrorBoundary>
  )
}

