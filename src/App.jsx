import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react"
import { Canvas } from "@react-three/fiber"
import { Preload, useProgress } from "@react-three/drei"
import { useNavigate } from "react-router-dom"
import Scene from "./components/Scene"
import Navbar from "./components/Navbar"
import { dropClickBus } from "./components/Beanstalk"
import { allDroplets } from "./data/portfolio"
import gsap from "gsap"

/* ─── Total scroll pages ─────────────────────────────────────── */
const SCROLL_PAGES = 7 // 700vh / 100vh

function DropNavList({ dropScrollTs, scrollProgress, onItemClick }) {
  const t = 1 - scrollProgress
  let activeIdx = -1
  if (dropScrollTs.length > 0) {
    let bestDist = Infinity
    dropScrollTs.forEach((st, i) => {
      const dist = Math.abs(t - st)
      if (dist < bestDist) {
        bestDist = dist
        activeIdx = i
      }
    })
  }

  return (
    <ul className="drop-nav-list">
      {allDroplets.map((drop, i) => (
        <li
          key={drop.id}
          className={`drop-nav-item${activeIdx === i ? " active" : ""}`}
          onClick={() => onItemClick(i)}
        >
          <span className="drop-nav-label">
            {drop.bubbleLabel || drop.title}
          </span>
        </li>
      ))}
    </ul>
  )
}

function AppLoadingOverlay() {
  const { active } = useProgress()
  const wasActive = useRef(active)
  const [visible, setVisible] = useState(active)

  useEffect(() => {
    if (active) {
      wasActive.current = true
      setVisible(true)
    } else if (wasActive.current) {
      setVisible(false)
    }
  }, [active])

  if (!visible) return null
  return (
    <div className="spinner-container spinner-container--fullpage">
      <h1 className="spinner-title">LOADING...</h1>
    </div>
  )
}

export default function App() {
  const scrollRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(1)
  const [activeSection, setActiveSection] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [dropScrollTs, setDropScrollTs] = useState([])
  const [whiteFade, setWhiteFade] = useState(false)
  const navigate = useNavigate()
  // Minimum scroll fraction (0–1) enforced once drop positions are resolved.
  // Prevents scrolling above the topmost water drop.
  const minScrollFractionRef = useRef(0)

  /* Track raw scroll progress 0→1 */
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const raw = max > 0 ? window.scrollY / max : 0

      // Clamp: prevent scrolling past the topmost water drop
      const minFrac = minScrollFractionRef.current
      if (minFrac > 0 && raw < minFrac) {
        window.scrollTo({ top: Math.round(minFrac * max), behavior: "instant" })
        return
      }

      const p = raw
      setScrollProgress(p)
      setScrolled(p > 0.02)

      /* Determine which droplet section is closest */
      const idx = allDroplets.findIndex((d, i) => {
        const next = allDroplets[i + 1]
        const start = d.stalkT - 0.08
        const end = next ? next.stalkT - 0.08 : 1
        return p >= start && p < end
      })
      setActiveSection(idx >= 0 ? allDroplets[idx] : null)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* Listen for the scroll cap signal from the 3D scene */
  useEffect(() => {
    const handler = (e) => {
      // scrollProgress = 1 - t, so minFraction = 1 - maxT
      minScrollFractionRef.current = 1 - e.detail.maxT
      if (e.detail.dropTs) setDropScrollTs(e.detail.dropTs)
    }
    window.addEventListener("scrollcapset", handler)
    return () => window.removeEventListener("scrollcapset", handler)
  }, [])

  /* Start at the bottom of the scroll space (base of beanstalk) — instant, no animation */
  useLayoutEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight - window.innerHeight,
      behavior: "instant",
    })
    // Clear any leftover zoom state from a previous droplet click
    dropClickBus.active = false
    dropClickBus.targetPos = null
  }, [])

  /* Intro animation */
  useEffect(() => {
    gsap.fromTo(
      ".scroll-hint",
      { opacity: 0 },
      { opacity: 1, duration: 1.8, ease: "power2.out", delay: 1.4 },
    )
  }, [])

  /* White fade on drop click → navigate to route after fade */
  useEffect(() => {
    const handleDropClick = (e) => {
      const route = e.detail?.data?.route
      setWhiteFade(true)
      if (route) {
        // Wait for the 1s fade transition to complete, then navigate
        setTimeout(() => {
          navigate(route)
        }, 1050)
      }
    }
    window.addEventListener("dropletclick", handleDropClick)
    return () => window.removeEventListener("dropletclick", handleDropClick)
  }, [navigate])

  const scrollToDropIdx = useCallback(
    (idx) => {
      const st = dropScrollTs[idx]
      if (st == null) return
      const sp = 1 - st
      const max = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo({ top: Math.round(sp * max), behavior: "smooth" })
    },
    [dropScrollTs],
  )

  const dismissFade = () => {
    setWhiteFade(false)
    dropClickBus.active = false
    dropClickBus.targetPos = null
  }

  return (
    <>
      {/* ── Tall scroll space ────────────────────────────────── */}
      <div className="scroll-space" ref={scrollRef} />

      {/* ── Fixed Three.js canvas ────────────────────────────── */}
      <div className="canvas-container">
        <Canvas
          camera={{ position: [12, 66, 12], fov: 55, near: 0.1, far: 600 }}
          performance={{ min: 0.5 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          dpr={[1, 1.5]}
        >
          <Scene scrollProgress={scrollProgress} />
          <Preload all />
        </Canvas>
      </div>

      {/* ── Loading overlay ───────────────────────────────────── */}
      <AppLoadingOverlay />

      {/* ── White fade overlay ────────────────────────────── */}
      <div
        className={`white-fade${whiteFade ? " visible" : ""}`}
        onClick={dismissFade}
      />

      {/* ── UI Overlay ──────────────────────────────────────── */}
      <div className="ui-overlay">
        {/* Navbar */}
        <Navbar />

        {/* Drop navigation list */}
        {dropScrollTs.length > 0 && (
          <DropNavList
            dropScrollTs={dropScrollTs}
            scrollProgress={scrollProgress}
            onItemClick={scrollToDropIdx}
          />
        )}

        {/* Scroll hint */}
        <div className={`scroll-hint ${scrolled ? "hidden" : ""}`}>
          <span>Scroll</span>
          <div className="scroll-arrow" />
        </div>
      </div>
    </>
  )
}
