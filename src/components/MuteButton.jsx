import React from "react";

const SpeakerOff = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const SpeakerOn = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

/**
 * A bare icon button that toggles between muted and unmuted states.
 *
 * @param {boolean} muted - Current muted state
 * @param {() => void} onToggle - Called when the button is clicked
 * @param {string} [className] - Optional CSS class override
 */
export default function MuteButton({
  muted,
  onToggle,
  className = "fc-mute-btn",
}) {
  return (
    <button
      className={className}
      onClick={onToggle}
      aria-label={muted ? "Unmute" : "Mute"}
    >
      {muted ? <SpeakerOff /> : <SpeakerOn />}
    </button>
  );
}
