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
import IntroSequence from "./components/IntroSequence"
import LoadingScreen from "./components/LoadingScreen"
import { PROTOTYPE_IMAGES } from "./components/MarketplacePrototype"
import { VIDEO_PHOTO_ASSETS } from "./components/VideoPhotographyPage"
import { dropClickBus } from "./components/Beanstalk"
import { allDroplets } from "./data/portfolio"
import { marketplaceJourney, journeyAssets } from "./data/journeys"
import { prefetchMedia, connectionIsFrugal } from "./hooks/useMediaPreload"
import gsap from "gsap"

/* ─── Total scroll pages ─────────────────────────────────────── */
const SCROLL_PAGES = 7 // 700vh / 100vh

/* The intro is a first-arrival moment, not something to sit through again on
   the way back from a case study. Returning here — via "Back to the Garden",
   the logo, or the browser's back button — should land straight in the scene.

   sessionStorage rather than a module flag because the logo is a real
   navigation that reloads the app, and rather than localStorage so a genuinely
   new visit still gets the intro. Access is guarded: Safari's private mode
   throws on read in some versions. */
const INTRO_SEEN_KEY = "godspeed:intro-seen"

function introAlreadySeen() {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === "1"
  } catch {
    return false
  }
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1")
    // reset scroll position
    window.scrollTo(0, 0)
  } catch {
    /* storage unavailable — the intro just plays again, which is harmless */
  }
}

/* Scroll fraction is 1 - t, so the drop with the LARGEST t sits nearest the
   top of the scroll range. Starting there leaves the whole journey ahead of
   the reader as a downward scroll.

   Resolved from the measured positions rather than assumed to be index 0, so
   a reordered GLB can't silently drop the reader at the wrong end. */
function topmostDropIdx(dropTs) {
  let best = 0
  dropTs.forEach((t, i) => {
    if (t > dropTs[best]) best = i
  })
  return best
}

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

/* Every asset behind a page the reader hasn't opened yet. Warmed in the
   background once the garden itself is loaded and idle, so opening one of
   those pages finds its media already here and skips its loading screen.

   Deliberately not the whole of /public: the long film is 42MB and belongs
   to a press of play, not to arriving at the site. */
const OTHER_PAGE_MEDIA = [
  ...journeyAssets(marketplaceJourney),
  ...PROTOTYPE_IMAGES,
  ...VIDEO_PHOTO_ASSETS,
  "/about-1.webp",
  "/about-2.webp",
]

function AppLoadingOverlay() {
  const { active, progress } = useProgress()
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
  return <LoadingScreen variant="fullpage" progress={progress / 100} />
}

/* Lives inside the Canvas: useProgress is only meaningful next to the
   loaders it watches. Reports the scene as done exactly once. */
function SceneReadyBeacon({ onReady }) {
  const { active, progress } = useProgress()
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || active || progress < 100) return
    firedRef.current = true
    onReady()
  }, [active, progress, onReady])

  return null
}

export default function App() {
  const scrollRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(1)
  const [activeSection, setActiveSection] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [dropScrollTs, setDropScrollTs] = useState([])
  const [whiteFade, setWhiteFade] = useState(false)
  const [activeDropIdx, setActiveDropIdx] = useState(-1)
  /* The intro title card owns the screen until its click animation lands.
     The scene starts fading up first (`sceneRevealed`) so the two cross-fade;
     `introDone` then tears the card down and brings the UI in. */
  const [sceneRevealed, setSceneRevealed] = useState(introAlreadySeen)
  const [introDone, setIntroDone] = useState(introAlreadySeen)
  const navigate = useNavigate()
  // Minimum scroll fraction (0–1) enforced once drop positions are resolved.
  // Prevents scrolling above the topmost water drop.
  const minScrollFractionRef = useRef(0)
  /* The background warming runs once per visit, whichever trigger gets there */
  const prefetchStartedRef = useRef(false)
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
    const open = () => {
      modalScrollOpenRef.current = true
    }
    const close = () => {
      modalScrollOpenRef.current = false
    }
    window.addEventListener("about:modalopen", open)
    window.addEventListener("about:modalclose", close)
    return () => {
      window.removeEventListener("about:modalopen", open)
      window.removeEventListener("about:modalclose", close)
    }
  }, [])

  /* On mobile, block manual touch/wheel scrolling — only arrows drive navigation */
  useEffect(() => {
    if (!isMobileRef.current || !introDone) return
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
  }, [introDone])

  /* Track raw scroll progress 0→1 */
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const raw = max > 0 ? window.scrollY / max : 0

      // Clamp: prevent scrolling past the topmost water drop. The epsilon
      // matters — the start position rounds to a whole pixel and can land a
      // hair under minFrac, which would otherwise bounce here and never
      // publish the opening progress.
      const minFrac = minScrollFractionRef.current
      if (minFrac > 0 && raw < minFrac - 1e-4) {
        window.scrollTo({ top: Math.ceil(minFrac * max), behavior: "instant" })
        return
      }

      const p = Math.max(raw, minFrac)
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
        // Start on the highest waterdrop, so every drop below it is reached
        // by scrolling down
        if (e.detail.dropTs.length > 0) {
          const topIdx = topmostDropIdx(e.detail.dropTs)
          const sp = 1 - e.detail.dropTs[topIdx]
          const max = document.documentElement.scrollHeight - window.innerHeight
          window.scrollTo({ top: Math.round(sp * max), behavior: "instant" })
          setActiveDropIdx(topIdx)
        }
      }
    }
    window.addEventListener("scrollcapset", handler)
    return () => window.removeEventListener("scrollcapset", handler)
  }, [])

  /* Park at the top of the scroll space until the drop positions resolve —
     instant, no animation. The scrollcapset handler then settles on the
     highest drop, leaving the rest of the stalk below as a downward scroll. */
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
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
    const topIdx = topmostDropIdx(ts)
    const sp = 1 - ts[topIdx]
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: Math.round(sp * max), behavior: "instant" })
    setActiveDropIdx(topIdx)
  }, [])

  /* Scroll-hint fade-in — runs once the overlay is mounted */
  useEffect(() => {
    if (!introDone) return
    gsap.fromTo(
      ".scroll-hint",
      { opacity: 0 },
      { opacity: 1, duration: 1.8, ease: "power2.out", delay: 1.4 },
    )
  }, [introDone])

  /* White fade on drop click → navigate to route after fade */
  useEffect(() => {
    const handleDropClick = (e) => {
      const { route, externalUrl } = e.detail?.data ?? {}

      /* External links open in a new tab — this page stays put, so skip
         the fade and cancel the camera zoom the click just triggered. */
      if (externalUrl) {
        dropClickBus.active = false
        dropClickBus.targetPos = null
        window.open(externalUrl, "_blank", "noopener,noreferrer")
        return
      }

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

  /* Kicked off when the garden has finished loading — never before, so the
     scene's own assets never compete with it for the connection. Idle time
     if the browser offers any, and skipped entirely on a connection that has
     asked us not to spend its bandwidth. */
  const startBackgroundPrefetch = useCallback(() => {
    if (prefetchStartedRef.current) return
    prefetchStartedRef.current = true
    if (connectionIsFrugal()) return
    const run = () => prefetchMedia(OTHER_PAGE_MEDIA)
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 4000 })
    } else {
      setTimeout(run, 1200)
    }
  }, [])

  /* Backstop: a scene served entirely from cache can settle without the
     progress store ever reporting a load, and the warming shouldn't be lost
     to that. Late is fine here — it is all background work. */
  useEffect(() => {
    const id = setTimeout(startBackgroundPrefetch, 8000)
    return () => clearTimeout(id)
  }, [startBackgroundPrefetch])

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
      {/* Mounted from the start so the scene preloads behind the intro */}
      <div className={`canvas-container${sceneRevealed ? " revealed" : ""}`}>
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
          <SceneReadyBeacon onReady={startBackgroundPrefetch} />
        </Canvas>
      </div>

      {/* ── Intro title card ──────────────────────────────────── */}
      {!introDone && (
        <IntroSequence
          onReveal={() => setSceneRevealed(true)}
          onComplete={() => {
            markIntroSeen()
            setIntroDone(true)
          }}
        />
      )}

      {/* ── Loading overlay ───────────────────────────────────── */}
      {/* Only after the intro — until then the title card is the loader */}
      {introDone && <AppLoadingOverlay />}

      {/* ── White fade overlay ────────────────────────────── */}
      <div
        className={`white-fade${whiteFade ? " visible" : ""}`}
        onClick={dismissFade}
      />

      {/* ── UI Overlay ──────────────────────────────────────── */}
      {introDone && (
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
      )}
    </>
  )
}
