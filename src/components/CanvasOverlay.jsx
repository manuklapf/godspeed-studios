import React from "react";

/**
 * Arcade-style text overlay centred at the bottom of a canvas wrapper.
 *
 * @param {string} text       - Label to display
 * @param {boolean} pulse     - Whether to animate with the pulsing idle style
 * @param {() => void} [onClick] - If provided, the overlay becomes clickable
 */
export default function CanvasOverlay({ text, pulse = false, onClick }) {
  const clickable = typeof onClick === "function";
  return (
    <div
      className={`fc-canvas-overlay${clickable ? " fc-canvas-overlay--clickable" : ""}`}
      onClick={onClick}
    >
      <span
        className={`fc-overlay-text${pulse ? " fc-overlay-text--prompt" : " fc-overlay-text--action"}`}
      >
        {text}
      </span>
    </div>
  );
}
