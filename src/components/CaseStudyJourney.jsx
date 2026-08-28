import React, { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import ModalCloseButton from "./ModalCloseButton"

/* ──────────────────────────────────────────────────────────────
   CaseStudyJourney

   The four beats every build goes through — ideation, the problems that
   surface, the research and prototyping that answer them, and what
   actually shipped. Each beat is one card, so a case study reads as four
   steps rather than one wall of prose.

   Shape of a step:
     { title, lead, points?: string[], media?: { label, caption?, src?,
       ratio? }[], slot?: string }

   `slot` names a piece of live content the page passes in through `slots`
   — a running prototype, say — so the data file stays data and the page
   keeps ownership of the component.

   A media entry with no `src` renders a labelled placeholder panel — the
   layout is real, the artwork is not yet.

   Artwork opens full size in a lightbox on click — the screenshots carry
   detail the card-sized frame can't show. Placeholders don't; there is
   nothing behind them to open.
   ────────────────────────────────────────────────────────────── */

function JourneyMedia({
  label,
  caption,
  src,
  alt,
  ratio = "16 / 10",
  narrow = false,
  onOpen,
}) {
  /* A real button when there is artwork behind it, so the keyboard and
     assistive tech get the same way in as the pointer. */
  const Frame = src ? "button" : "div"
  const frameProps = src
    ? {
        type: "button",
        onClick: () => onOpen({ src, alt: alt || label }),
        "aria-label": `View ${alt || label} full size`,
      }
    : {}

  return (
    <figure className={`js-figure${narrow ? " js-figure--narrow" : ""}`}>
      {/* --frame-ratio hands the same ratio to CSS as a number it can do
          arithmetic with, so the height cap can be held by capping width —
          see .js-frame */}
      <Frame
        className={`js-frame${src ? " js-frame--zoom" : ""}`}
        style={{ aspectRatio: ratio, "--frame-ratio": ratio }}
        {...frameProps}
      >
        {src ? (
          <img src={src} alt={alt || label} decoding="async" />
        ) : (
          <div className="js-placeholder" aria-hidden="true">
            <svg viewBox="0 0 32 32" className="js-placeholder-mark">
              <rect
                x="4"
                y="6"
                width="24"
                height="20"
                rx="2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M7 22l6-7 4.5 5 3-3.5L25 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="20.5" cy="12" r="1.8" fill="currentColor" />
            </svg>
            <span className="js-placeholder-label">{label}</span>
          </div>
        )}
      </Frame>
      {caption && <figcaption className="js-caption">{caption}</figcaption>}
    </figure>
  )
}

/* ──────────────────────────────────────────────────────────────
   Lightbox — one image over the page, on the prototype modal's backdrop

   Portalled to the body: as a child of .cs-page it would pick up the card
   grid's top margin, which a fixed box with inset 0 reads as an offset.
   ────────────────────────────────────────────────────────────── */
function Lightbox({ image, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose()
    /* the page behind must not scroll while the overlay owns the screen */
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="cs-stage"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
    >
      <ModalCloseButton onClose={onClose} label="Close image" />
      {/* The image is the panel — as a flex child of the fixed backdrop it
          has a definite box to size against, so it fills the screen without
          being cropped or letterboxed inside a wrapper. */}
      <img
        className="cs-stage-modal js-lightbox-img"
        src={image.src}
        alt={image.alt}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  )
}

export default function CaseStudyJourney({ steps, slots = {} }) {
  const [lightbox, setLightbox] = useState(null)
  /* stable, so the lightbox's key/scroll-lock effect isn't torn down and
     rebuilt on every render of the page */
  const closeLightbox = useCallback(() => setLightbox(null), [])

  return (
    <>
      {steps.map((step, i) => {
        const slot = step.slot ? slots[step.slot] : null

        return (
          <section
            className="js-section"
            key={step.title}
            aria-labelledby={`js-${step.title.toLowerCase()}`}
          >
            <div className="js-head">
              <span className="js-step">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="js-title" id={`js-${step.title.toLowerCase()}`}>
                {step.title}
              </h2>
            </div>

            <div
              className={`js-body${
                slot && !step.media ? " js-body--stacked" : ""
              }`}
            >
              <div className="js-copy">
                <p className="js-lead">{step.lead}</p>
                {step.points && (
                  <ul className="js-points">
                    {step.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}

                {/* the way in sits under the copy, in the copy's own column */}
                {slot && <div className="js-slot">{slot}</div>}
              </div>

              {step.media && (
                <div
                  className={`js-media${
                    step.media.length > 1 ? " js-media--split" : ""
                  }`}
                >
                  {step.media.map((m) => (
                    <JourneyMedia key={m.label} {...m} onOpen={setLightbox} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      })}

      {lightbox && (
        <Lightbox image={lightbox} onClose={closeLightbox} />
      )}
    </>
  )
}
