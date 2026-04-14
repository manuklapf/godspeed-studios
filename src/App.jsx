import React, { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import Scene from './components/Scene'
import { allDroplets } from './data/portfolio'
import gsap from 'gsap'

/* ─── Total scroll pages ─────────────────────────────────────── */
const SCROLL_PAGES = 7   // 700vh / 100vh

export default function App() {
  const scrollRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSection, setActiveSection] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  /* Track raw scroll progress 0→1 */
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
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
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Intro animation */
  useEffect(() => {
    gsap.fromTo(
      '.hero-title',
      { opacity: 0, y: -24 },
      { opacity: 1, y: 0, duration: 2.2, ease: 'power3.out', delay: 0.4 }
    )
    gsap.fromTo(
      '.scroll-hint',
      { opacity: 0 },
      { opacity: 1, duration: 1.8, ease: 'power2.out', delay: 1.4 }
    )
  }, [])

  return (
    <>
      {/* ── Tall scroll space ────────────────────────────────── */}
      <div className="scroll-space" ref={scrollRef} />

      {/* ── Fixed Three.js canvas ────────────────────────────── */}
      <div className="canvas-container">
        <Canvas
          camera={{ position: [12, 2, 12], fov: 55, near: 0.1, far: 600 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 1.5]}
        >
          <Scene scrollProgress={scrollProgress} />
          <Preload all />
        </Canvas>
      </div>

      {/* ── UI Overlay ──────────────────────────────────────── */}
      <div className="ui-overlay">
        {/* Hero */}
        <div className="hero-title">
          <h1>Your Name</h1>
          <p>Designer &amp; Developer · In the clouds</p>
        </div>

        {/* Section label */}
        <div className={`section-label ${activeSection && scrolled ? 'visible' : ''}`}>
          {activeSection && (
            <>
              <h2>{activeSection.title}</h2>
              <p>{activeSection.tag} · {activeSection.year}</p>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ height: `${scrollProgress * 100}%` }}
          />
        </div>

        {/* Scroll hint */}
        <div className={`scroll-hint ${scrolled ? 'hidden' : ''}`}>
          <span>Scroll</span>
          <div className="scroll-arrow" />
        </div>
      </div>
    </>
  )
}
