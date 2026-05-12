import { useState, useRef } from "react";

/**
 * Manages a muted boolean state paired with a ref that stays in sync.
 * The ref is safe to read inside Three.js callbacks without stale closures.
 *
 * @param {boolean} initial - Starting muted value (default: true)
 */
export function useMuted(initial = true) {
  const [muted, setMuted] = useState(initial);
  const mutedRef = useRef(initial);
  mutedRef.current = muted;
  return { muted, setMuted, mutedRef };
}
