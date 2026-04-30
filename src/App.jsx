import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import Scene from './components/Scene'
import Navbar from './components/Navbar'
import { dropClickBus } from './components/Beanstalk'
import { allDroplets } from './data/portfolio'
import gsap from 'gsap'

/* ─── Total scroll pages ─────────────────────────────────────── */
const SCROLL_PAGES = 7   // 700vh / 100vh

export default function App() {
  const scrollRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(1)
  const [activeSection, setActiveSection] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [whiteFade, setWhiteFade] = useState(false)
  const navigate = useNavigate()

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

  /* Start at the bottom of the scroll space (base of beanstalk) — instant, no animation */
  useLayoutEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight - window.innerHeight, behavior: 'instant' })
    // Clear any leftover zoom state from a previous droplet click
    dropClickBus.active = false
    dropClickBus.targetPos = null
  }, [])

  /* Intro animation */
  useEffect(() => {
    gsap.fromTo(
      '.scroll-hint',
      { opacity: 0 },
      { opacity: 1, duration: 1.8, ease: 'power2.out', delay: 1.4 }
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
    window.addEventListener('dropletclick', handleDropClick)
    return () => window.removeEventListener('dropletclick', handleDropClick)
  }, [navigate])

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

      {/* ── White fade overlay ────────────────────────────── */}
      <div
        className={`white-fade${whiteFade ? ' visible' : ''}`}
        onClick={dismissFade}
      />

      {/* ── UI Overlay ──────────────────────────────────────── */}
      <div className="ui-overlay">
        {/* Navbar */}
        <Navbar />

        {/* Section label */}
        <div className={`section-label ${activeSection && scrolled ? 'visible' : ''}`}>
          {activeSection && (
            <>
              <h2>{activeSection.title}</h2>
              <p>{activeSection.tag} · {activeSection.year}</p>
            </>
          )}
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
