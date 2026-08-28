import React from "react"

/* ──────────────────────────────────────────────────────────────
   LoadingScreen

   The one loading state the site has, in three grounds:

     default   dark, for the inside of a 3D viewer
     fullpage  fixed over the whole page, on the light ground
     panel     filling whatever box it is dropped into (a modal, a card)

   `progress` is optional — pass a 0–1 fraction to show the bar, leave it
   out when there is nothing meaningful to count.
   ────────────────────────────────────────────────────────────── */

export default function LoadingScreen({ variant = "fullpage", progress }) {
  const ground = variant === "default" ? "" : ` spinner-container--${variant}`

  return (
    <div
      className={`spinner-container${ground}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <h1 className="spinner-title">LOADING...</h1>
      {progress != null && (
        <div className="spinner-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.min(progress, 1)})` }} />
        </div>
      )}
    </div>
  )
}
