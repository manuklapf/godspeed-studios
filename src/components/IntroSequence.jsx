import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react"
import gsap from "gsap"

/* ──────────────────────────────────────────────────────────────
   IntroSequence

   A full-bleed title card that owns the first moments of the site.

     1. "Building Worlds." alone on the light ground.
     2. Scrolling fades "One Click At a Time." in underneath, set in the
        same size and colour so the two read as one block of type.
     3. Scrolling past the end sends a mouse pointer across the screen to
        click the word "Click"; the type then fades out and the 3D scene
        fades in behind it.

   Scroll is read from raw wheel / touch / key deltas rather than from the
   document, so the page's own scroll position stays parked wherever App
   put it and never has to be wound back when the intro is done.
   ────────────────────────────────────────────────────────────── */

/* Wheel pixels needed to travel the whole intro */
const SCROLL_DISTANCE = 1100

/* An element's live translateY — mid-transition values included, since
   getComputedStyle reports the interpolated matrix while one is running. */
function shiftY(el) {
  if (!el) return 0
  const t = getComputedStyle(el).transform
  if (!t || t === "none") return 0
  try {
    return new DOMMatrixReadOnly(t).f
  } catch {
    return 0
  }
}
/* Progress at which the second line starts / finishes fading in */
const LINE_TWO_IN = 0.26
const LINE_TWO_OUT = 0.62

export default function IntroSequence({ onReveal, onComplete }) {
  const rootRef = useRef(null)
  const typeRef = useRef(null)
  const lineOneRef = useRef(null)
  const lineTwoRef = useRef(null)
  const clickWordRef = useRef(null)
  const cursorRef = useRef(null)
  const rippleRef = useRef(null)

  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)
  /* Latches the moment the pointer animation takes over from the scroll */
  const playingRef = useRef(false)

  const lineTwoOpacity = Math.min(
    Math.max((progress - LINE_TWO_IN) / (LINE_TWO_OUT - LINE_TWO_IN), 0),
    1,
  )

  /* The second line always occupies its space so the type never reflows —
     which leaves line one sitting high. Nudging the block down by half that
     height centres line one on its own, then releases as line two arrives. */
  const [lineTwoHeight, setLineTwoHeight] = useState(0)
  useLayoutEffect(() => {
    const measure = () => {
      const el = lineTwoRef.current
      if (!el) return
      const mt = parseFloat(getComputedStyle(el).marginTop) || 0
      setLineTwoHeight(el.offsetHeight + mt)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  /* ── The click, then the handoff ───────────────────────────── */
  const playClick = useCallback(() => {
    if (playingRef.current) return
    playingRef.current = true

    const word = clickWordRef.current
    const cursor = cursorRef.current
    const ripple = rippleRef.current
    if (!word || !cursor) {
      onReveal()
      onComplete()
      return
    }

    /* A fast scroll drives progress to 1 while the type is still easing into
       place: this runs inside the wheel handler, so .intro-type is mid-
       transition and line two hasn't re-rendered yet. The word's box is
       therefore below where it comes to rest — subtracting the shifts still
       in flight gives the resting position the cursor should aim for. */
    const box = word.getBoundingClientRect()
    const inFlightY = shiftY(typeRef.current) + shiftY(lineTwoRef.current)

    /* Land on the word, a touch below centre — where a real pointer tip sits */
    const targetX = box.left + box.width / 2
    const targetY = box.top + box.height * 0.62 - inFlightY

    gsap.set(cursor, {
      x: targetX + Math.min(window.innerWidth * 0.22, 320),
      y: targetY + Math.min(window.innerHeight * 0.28, 260),
      opacity: 0,
      scale: 1,
    })
    gsap.set(ripple, { x: targetX, y: targetY, opacity: 0, scale: 0.2 })

    const tl = gsap.timeline({ onComplete })

    tl.to(cursor, { opacity: 1, duration: 0.35, ease: "power2.out" })
      .to(
        cursor,
        { x: targetX, y: targetY, duration: 0.95, ease: "power3.inOut" },
        "<",
      )
      /* the press */
      .to(cursor, { scale: 0.82, duration: 0.1, ease: "power2.in" }, "+=0.12")
      .to(word, { scale: 0.94, duration: 0.1, ease: "power2.in" }, "<")
      .to(ripple, { opacity: 0.5, scale: 0.35, duration: 0.1 }, "<")
      /* the release */
      .to(cursor, { scale: 1, duration: 0.22, ease: "back.out(3)" })
      .to(word, { scale: 1, duration: 0.3, ease: "back.out(3)" }, "<")
      .to(
        ripple,
        { opacity: 0, scale: 1, duration: 0.5, ease: "power2.out" },
        "<",
      )
      /* hand the screen over to the scene */
      .call(onReveal, null, "+=0.15")
      .to(cursor, { opacity: 0, duration: 0.35, ease: "power2.in" }, "<")
      .to(
        [lineTwoRef.current, lineOneRef.current],
        {
          opacity: 0,
          y: -18,
          duration: 0.7,
          ease: "power2.inOut",
          stagger: 0.08,
        },
        "<",
      )
      .to(
        rootRef.current,
        { opacity: 0, duration: 0.8, ease: "power2.inOut" },
        "-=0.35",
      )
  }, [onReveal, onComplete])

  /* ── Scroll intent, taken straight off the input devices ───── */
  useEffect(() => {
    const advance = (delta) => {
      if (playingRef.current) return
      const next = Math.min(
        Math.max(progressRef.current + delta / SCROLL_DISTANCE, 0),
        1,
      )
      progressRef.current = next
      setProgress(next)
      if (next >= 1) playClick()
    }

    const onWheel = (e) => {
      e.preventDefault()
      advance(e.deltaY)
    }

    let touchY = null
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY
    }
    const onTouchMove = (e) => {
      if (touchY == null) return
      /* swallow the gesture — the document behind must stay where App parked it */
      if (e.cancelable) e.preventDefault()
      const y = e.touches[0].clientY
      /* touch drags cover less distance than a wheel — scale them up */
      advance((touchY - y) * 2.2)
      touchY = y
    }
    const onTouchEnd = () => {
      touchY = null
    }

    const onKeyDown = (e) => {
      if (["ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault()
        advance(e.key === "ArrowDown" ? 180 : 420)
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault()
        advance(e.key === "ArrowUp" ? -180 : -420)
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [playClick])

  /* Readers who can't scroll (or don't want motion) still get through */
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    setProgress(1)
    const id = setTimeout(playClick, 900)
    return () => clearTimeout(id)
  }, [playClick])

  return (
    <div className="intro" ref={rootRef}>
      <div
        className="intro-type"
        ref={typeRef}
        style={{
          transform: `translateY(${(lineTwoHeight / 2) * (1 - lineTwoOpacity)}px)`,
        }}
      >
        <h1 className="intro-line intro-line--one" ref={lineOneRef}>
          Building Worlds.
        </h1>
        <p
          className="intro-line intro-line--two"
          ref={lineTwoRef}
          style={{
            opacity: lineTwoOpacity,
            transform: `translateY(${(1 - lineTwoOpacity) * 16}px)`,
          }}
        >
          One{" "}
          <span className="intro-click-word" ref={clickWordRef}>
            Click
          </span>{" "}
          At a Time.
        </p>
      </div>

      {/* Click choreography */}
      <div className="intro-ripple" ref={rippleRef} aria-hidden="true" />
      <div className="intro-cursor" ref={cursorRef} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34">
          <path
            d="M5 2.5 L5 19.2 L9.2 15.2 L11.9 21.4 L14.9 20.1 L12.2 14 L18 13.8 Z"
            fill="currentColor"
            stroke="var(--bg-light)"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}
