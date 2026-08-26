import React from "react"

/* ──────────────────────────────────────────────────────────────
   CaseStudyCTA

   The one way into a case study's live thing — used twice per page: once
   under the header, once in the Solution beat. Both spots render the same
   label so the reader recognises the second as the offer they already saw.

   Pass `href` when the thing lives at a URL (opens in a new tab), or
   `onClick` when it opens in place.
   ────────────────────────────────────────────────────────────── */

function ArrowMark() {
  return (
    <svg
      className="cs-cta-mark"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function CaseStudyCTA({ label, href, onClick }) {
  if (href) {
    return (
      <a
        className="cs-cta"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
        <ArrowMark />
      </a>
    )
  }

  return (
    <button className="cs-cta" type="button" onClick={onClick}>
      {label}
      <ArrowMark />
    </button>
  )
}
