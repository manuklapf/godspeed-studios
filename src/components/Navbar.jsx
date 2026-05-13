import React, { useState, useEffect, useRef } from "react"
import ContactModal from "./ContactModal"

/* ──────────────────────────────────────────────────────────────
   Text scramble — cycles through random chars before settling
   ────────────────────────────────────────────────────────────── */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&"

function useScramble(target, { delay = 0, duration = 1200 } = {}) {
  const [display, setDisplay] = useState(() => target.replace(/./g, " "))
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
        .split("")
        .map((char, i) => {
          if (char === " ") return " "
          const resolveAt = (i / target.length) * 0.85
          if (progress >= resolveAt) return char
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join("")

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
      className={[done ? "wiggle" : "", hovered ? "wiggle-hover" : ""]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={() => setHovered(true)}
      onAnimationEnd={(e) => {
        if (e.animationName === "wiggle-hover") setHovered(false)
      }}
    >
      {text}
    </span>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  const logo = useScramble("GODSPEED", { delay: 200, duration: 1400 })
  const cont = useScramble("CONTACT", { delay: 850, duration: 1200 })

  return (
    <>
      <nav className="navbar">
        <a className="godspeed-logo" href="/">
          <WiggleSpan text={logo.text} done={logo.done} />
        </a>

        <div
          className={`hamburger-menu${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
        </div>

        <ul className="nav-links">
          <li>
            <button
              className="nav-contact-btn"
              onClick={() => setContactOpen(true)}
            >
              <span className="nav-contact-label">
                <WiggleSpan text={cont.text} done={cont.done} />
              </span>
              <span className="nav-contact-icon" aria-label="Contact">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
            </button>
          </li>
        </ul>
      </nav>

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </>
  )
}
