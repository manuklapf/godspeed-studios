import React from "react"

/* ──────────────────────────────────────────────────────────────
   ModalCloseButton

   The dismiss for anything that opens over the page — the prototype stage,
   the contact modal, the about modal. It belongs to the backdrop rather than
   to the panel: every one of those backdrops is `position: fixed; inset: 0`,
   so absolute placement here puts the button in the viewport's corner and
   keeps it clear of whatever the panel is doing with its own padding.

   Render it as a child of the backdrop, before the panel.
   ────────────────────────────────────────────────────────────── */

export default function ModalCloseButton({ onClose, label = "Close" }) {
  return (
    <button
      className="modal-close"
      type="button"
      onClick={onClose}
      aria-label={label}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M1 1l12 12M13 1L1 13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
