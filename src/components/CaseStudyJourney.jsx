import React from "react"

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
   ────────────────────────────────────────────────────────────── */

function JourneyMedia({
  label,
  caption,
  src,
  alt,
  ratio = "16 / 10",
  narrow = false,
}) {
  return (
    <figure className={`js-figure${narrow ? " js-figure--narrow" : ""}`}>
      <div className="js-frame" style={{ aspectRatio: ratio }}>
        {src ? (
          <img src={src} alt={alt || label} loading="lazy" decoding="async" />
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
      </div>
      {caption && <figcaption className="js-caption">{caption}</figcaption>}
    </figure>
  )
}

export default function CaseStudyJourney({ steps, slots = {} }) {
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
                    <JourneyMedia key={m.label} {...m} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      })}
    </>
  )
}
