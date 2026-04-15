import React, { Component, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

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
function applyEtherealMaterials(root) {
  root.traverse((node) => {
    if (!node.isMesh) return
    const name = (node.name || '').toLowerCase().replace(/[\s_-]/g, '')
    const isLeaf      = /leaf|leave|folia|blade/.test(name)
    const isStalk     = /stalk|stem|vine|trunk|branch/.test(name)
    const isWaterDrop = /waterdrop/.test(name)

    // Rebuild geometry as non-indexed so flatShading is crisp
    if (node.geometry) {
      node.geometry = node.geometry.toNonIndexed()
      node.geometry.computeVertexNormals()
    }

    if (isWaterDrop) {
      // Store original vertex positions for blob deformation
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
   Mirrors the effects applied to the floating WaterDroplet spheres
   ────────────────────────────────────────────────────────────── */
/* Shared ref so ScrollCamera can find the GLB WaterDrop in world space */
export const waterDropRef = { current: null }

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
    if (nodes.length > 0) waterDropRef.current = nodes[0]
    dropNodes.current = nodes
  }, [root])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    dropNodes.current.forEach((node) => {
      const phase = node.userData.phase || 0
      const base  = node.userData.basePosition

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

      // Per-vertex blob deformation
      if (node.userData.origPositions && node.geometry) {
        const pos  = node.geometry.attributes.position
        const orig = node.userData.origPositions
        const count = pos.count
        for (let i = 0; i < count; i++) {
          const ox = orig[i * 3]
          const oy = orig[i * 3 + 1]
          const oz = orig[i * 3 + 2]
          const len = Math.sqrt(ox * ox + oy * oy + oz * oz)
          if (len === 0) continue
          const nx = ox / len
          const ny = oy / len
          const nz = oz / len
          const wave =
            Math.sin(t * 1.3  + ox * 2.2 + phase)        * 0.006 +
            Math.sin(t * 0.85 + oy * 1.8 + phase * 0.6)  * 0.005 +
            Math.sin(t * 1.6  + oz * 2.5 + phase * 1.2)  * 0.004 +
            Math.sin(t * 0.55 + (ox + oz) * 1.4 + phase * 0.4) * 0.004
          // Clamp the bottom vertices so they don't deform below the leaf surface
          const newY = Math.max(oy + ny * wave, node.userData.contactY ?? oy)
          pos.setXYZ(i, ox + nx * wave, newY, oz + nz * wave)
        }
        pos.needsUpdate = true
        node.geometry.computeVertexNormals()
      }
    })
  })
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
      {[-0.8, 0.6, -0.3, 0.9].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0.05, i % 2 === 0 ? 0.5 : -0.4]}>
          <torusGeometry args={[0.5 + i * 0.15, 0.06, 4, 8, Math.PI * 0.7]} />
          <meshStandardMaterial color="#4a7a3a" flatShading roughness={1} emissive="#1a3a18" emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  )
}

/* ──────────────────────────────────────────────────────────────
   GLBBeanstalk — loads the real model (throws if file missing)
   ────────────────────────────────────────────────────────────── */
function GLBBeanstalk() {
  const { scene } = useGLTF('/beanstalk2.glb')

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
      {[-0.8, 0.6, -0.3, 0.9].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0.05, i % 2 === 0 ? 0.5 : -0.4]}>
          <torusGeometry args={[0.5 + i * 0.15, 0.06, 4, 8, Math.PI * 0.7]} />
          <meshStandardMaterial color="#4a7a3a" flatShading roughness={1} emissive="#1a3a18" emissiveIntensity={0.1} />
        </mesh>
      ))}
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

