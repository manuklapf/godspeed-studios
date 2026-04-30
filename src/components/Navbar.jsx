import React, { useState, useEffect, useRef } from 'react'

/* ──────────────────────────────────────────────────────────────
   Text scramble — cycles through random chars before settling
   ────────────────────────────────────────────────────────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&'

function useScramble(target, { delay = 0, duration = 1200 } = {}) {
  const [display, setDisplay] = useState(() => target.replace(/./g, ' '))
  const [done, setDone] = useState(false)
  const frame = useRef(null)

  useEffect(() => {
    let start = null
    let timeoutId = null

    function tick(timestamp) {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)

      const next = target
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' '
          const resolveAt = (i / target.length) * 0.85
          if (progress >= resolveAt) return char
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

      setDisplay(next)

      if (progress < 1) {
        frame.current = requestAnimationFrame(tick)
      } else {
        setDisplay(target)
        setDone(true)
      }
    }

    timeoutId = setTimeout(() => {
      frame.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [target, delay, duration])

  return { text: display, done }
}

/* ──────────────────────────────────────────────────────────────
   Navbar
   ────────────────────────────────────────────────────────────── */
function WiggleSpan({ text, done }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      className={[done ? 'wiggle' : '', hovered ? 'wiggle-hover' : ''].filter(Boolean).join(' ')}
      onMouseEnter={() => setHovered(true)}
      onAnimationEnd={(e) => { if (e.animationName === 'wiggle-hover') setHovered(false) }}
    >
      {text}
    </span>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const logo = useScramble('GODSPEED', { delay: 200, duration: 1400 })
  const cont = useScramble('CONTACT',  { delay: 850, duration: 1200 })

  return (
    <nav className="navbar">
      <a className="godspeed-logo" href="/">
        <WiggleSpan text={logo.text} done={logo.done} />
      </a>

      <div
        className={`hamburger-menu${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle navigation"
      >
        <div className="bar" />
        <div className="bar" />
        <div className="bar" />
      </div>

      <ul className={`nav-links${menuOpen ? ' show' : ''}`}>
        <li><a href="/contact"   onClick={() => setMenuOpen(false)}><WiggleSpan text={cont.text} done={cont.done} /></a></li>
      </ul>
    </nav>
  )
}
