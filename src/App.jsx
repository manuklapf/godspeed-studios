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
import Scene, { scrollCapSignal } from "./components/Scene"
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
  const [activeDropIdx, setActiveDropIdx] = useState(-1)
  const navigate = useNavigate()
  // Minimum scroll fraction (0–1) enforced once drop positions are resolved.
  // Prevents scrolling above the topmost water drop.
  const minScrollFractionRef = useRef(0)
  // Detect mobile once on mount
  const isMobileRef = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches,
  )
  // Keep a ref to dropScrollTs so the scroll handler sees the latest value
  const dropScrollTsRef = useRef([])
  useEffect(() => {
    dropScrollTsRef.current = dropScrollTs
  }, [dropScrollTs])

  /* Tracks whether a modal that needs scrolling is open — pauses the touch block */
  const modalScrollOpenRef = useRef(false)
  useEffect(() => {
    const open = () => { modalScrollOpenRef.current = true }
    const close = () => { modalScrollOpenRef.current = false }
    window.addEventListener("about:modalopen", open)
    window.addEventListener("about:modalclose", close)
    return () => {
      window.removeEventListener("about:modalopen", open)
      window.removeEventListener("about:modalclose", close)
    }
  }, [])

  /* On mobile, block manual touch/wheel scrolling — only arrows drive navigation */
  useEffect(() => {
    if (!isMobileRef.current) return
    const block = (e) => {
      if (modalScrollOpenRef.current) return
      e.preventDefault()
    }
    document.addEventListener("touchmove", block, { passive: false })
    document.addEventListener("wheel", block, { passive: false })
    return () => {
      document.removeEventListener("touchmove", block)
      document.removeEventListener("wheel", block)
    }
  }, [])

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

      // Track nearest drop index for mobile arrow visibility
      const ts = dropScrollTsRef.current
      if (ts.length > 0) {
        const t = 1 - p
        let bestDist = Infinity
        let nearestIdx = 0
        ts.forEach((st, i) => {
          const dist = Math.abs(t - st)
          if (dist < bestDist) {
            bestDist = dist
            nearestIdx = i
          }
        })
        setActiveDropIdx(nearestIdx)
      }

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
      if (e.detail.dropTs) {
        setDropScrollTs(e.detail.dropTs)
        // Always start focused on the last (highest) waterdrop
        if (e.detail.dropTs.length > 0) {
          const lastIdx = e.detail.dropTs.length - 1
          const lastDropT = e.detail.dropTs[lastIdx]
          const sp = 1 - lastDropT
          const max = document.documentElement.scrollHeight - window.innerHeight
          window.scrollTo({ top: Math.round(sp * max), behavior: "instant" })
          setActiveDropIdx(lastIdx)
        }
      }
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

  /* If navigating back to this page the scrollcapset event won't re-fire
     (scrollCapSignal.ready is already true). Re-apply last-drop focus now. */
  useEffect(() => {
    if (!scrollCapSignal.ready || scrollCapSignal.dropTs == null) return
    const ts = scrollCapSignal.dropTs
    if (ts.length === 0) return
    minScrollFractionRef.current = 1 - scrollCapSignal.maxT
    setDropScrollTs(ts)
    const lastIdx = ts.length - 1
    const sp = 1 - ts[lastIdx]
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: Math.round(sp * max), behavior: "instant" })
    setActiveDropIdx(lastIdx)
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

        {/* Mobile-only: up / down arrows to jump between waterdrops */}
        {isMobileRef.current && dropScrollTs.length > 0 && (
          <>
            <button
              className={`mobile-drop-arrow mobile-drop-arrow--up${
                activeDropIdx <= 0 ? " mobile-drop-arrow--hidden" : ""
              }`}
              onClick={() => scrollToDropIdx(activeDropIdx - 1)}
              aria-label="Previous waterdrop"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <button
              className={`mobile-drop-arrow mobile-drop-arrow--down${
                activeDropIdx >= dropScrollTs.length - 1
                  ? " mobile-drop-arrow--hidden"
                  : ""
              }`}
              onClick={() => scrollToDropIdx(activeDropIdx + 1)}
              aria-label="Next waterdrop"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </>
        )}
      </div>
    </>
  )
}
