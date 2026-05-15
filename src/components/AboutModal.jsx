import React, { useEffect, useCallback } from "react"
import { createPortal } from "react-dom"

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function AboutModal({ onClose }) {
  const handleBackdrop = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches
    if (isMobile) {
      window.dispatchEvent(new CustomEvent("about:modalopen"))
    } else {
      document.body.style.overflow = "hidden"
    }
    return () => {
      if (isMobile) {
        window.dispatchEvent(new CustomEvent("about:modalclose"))
      } else {
        document.body.style.overflow = ""
      }
    }
  }, [])

  return createPortal(
    <div className="about-backdrop" onClick={handleBackdrop}>
      <div
        className="about-modal"
        role="dialog"
        aria-modal="true"
        aria-label="About"
      >
        <button className="about-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className="about-layout">
          {/* ── Photos ── */}
          <div className="about-photos">
            <div className="about-photo-wrap">
              <img
                src="/about-1.webp"
                alt="Portrait"
                className="about-photo"
                draggable={false}
              />
            </div>
            <div className="about-photo-wrap about-photo-wrap--secondary">
              <img
                src="/about-2.webp"
                alt="#2 Portrait"
                className="about-photo"
                draggable={false}
              />
            </div>
          </div>

          {/* ── Text ── */}
          <div className="about-body">
            <span className="about-eyebrow">About</span>
            <h2 className="about-title">
              Designing worlds
              <br />
              worth living in.
            </h2>

            <p className="about-text">
              Modern products have become dull. Sterile. Soulless marketing has
              reduced campaigns & products we use every day down to be
              essentially frictionless. Most things are designed to fit in
              instead of stand out.
            </p>

            <p className="about-text">
              I strive to bring back that early 2000s feeling where products
              were bold, alive and at times a little naughty. Interfaces felt
              handcrafted and charme. Products showed effort to be unique and to
              stand out. Every experience seemed to have a sense of adventure,
              of essentially limitless world-building.
            </p>

            <p className="about-text">
              I craft products and digital experiences from the ground up. From
              finding an idea, through concept and research, building
              prototypes, and all the way to the finished, breathing product. I
              strive to design products that are not only useful and usable, but
              also fucking fun to use!
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
