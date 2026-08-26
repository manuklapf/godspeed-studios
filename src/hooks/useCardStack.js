import { useEffect } from "react"

/* ──────────────────────────────────────────────────────────────
   useCardStack

   Fades a stacked card out as the next one scrolls up over it.

   The stacking itself is pure CSS (position: sticky on each card, later
   siblings painting over earlier ones). This only supplies the part CSS
   can't: an opacity tied to how far the incoming card still has to travel.

   Which elements participate is read back from the computed style rather
   than hard-coded — anything the stylesheet resolves to `sticky` joins the
   stack, so the reduced-motion rule that drops them to `static` also turns
   this off with no second switch to keep in sync.
   ────────────────────────────────────────────────────────────── */

/* How far out the fade starts, measured from the resting line */
const fadeRange = () => Math.min(window.innerHeight * 0.62, 620)

export function useCardStack(ref) {
  useEffect(() => {
    const root = ref.current
    if (!root) return

    let cards = []
    let restLine = 0
    let frame = null

    const measure = () => {
      const children = Array.from(root.children)

      /* Decided fresh every time: a resize, or an image finally landing, can
         change which cards still fit. */
      children.forEach((el) => el.classList.remove("cs-card--tall"))

      /* `top` is a clamp(), so resolve it off whatever is sticky right now */
      const pinned = children.find(
        (el) => getComputedStyle(el).position === "sticky",
      )
      restLine = pinned ? parseFloat(getComputedStyle(pinned).top) || 0 : 0

      /* A card taller than the room under the rest line would pin with its
         tail below the fold and then get covered by the next card, so its
         end could never be read. Those opt out of sticking and scroll. */
      const room = window.innerHeight - restLine
      children.forEach((el) => {
        if (el.getBoundingClientRect().height > room) {
          el.classList.add("cs-card--tall")
        }
      })

      cards = children.filter(
        (el) => getComputedStyle(el).position === "sticky",
      )

      /* A card that just dropped out of the stack still carries whatever
         opacity it was last painted with, which would strand it half faded. */
      children.forEach((el) => {
        if (!cards.includes(el)) {
          el.style.opacity = ""
          el.style.pointerEvents = ""
        }
      })
    }

    const paint = () => {
      frame = null
      const range = fadeRange()

      cards.forEach((card) => {
        const next = card.nextElementSibling
        if (!next) {
          /* nothing is coming over the last card */
          card.style.opacity = ""
          card.style.pointerEvents = ""
          return
        }
        /* distance the incoming card's top edge still has to fall before it
           sits on the resting line — at 0 this card is fully covered */
        const gap = next.getBoundingClientRect().top - restLine
        const progress = Math.min(Math.max(1 - gap / range, 0), 1)
        card.style.opacity = String(1 - progress)
        /* A spent card is invisible but still sits under the navbar, where it
           would go on catching clicks meant for nothing at all. */
        card.style.pointerEvents = progress >= 1 ? "none" : ""
      })
    }

    const onScroll = () => {
      if (frame == null) frame = requestAnimationFrame(paint)
    }

    const onResize = () => {
      measure()
      onScroll()
    }

    measure()
    paint()

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)

    /* Cards change height as images land, which moves every edge this
       measures against and can change which cards still fit. */
    const observer = new ResizeObserver(onResize)
    observer.observe(root)

    return () => {
      if (frame != null) cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      observer.disconnect()
      Array.from(root.children).forEach((card) => {
        card.style.opacity = ""
        card.style.pointerEvents = ""
        card.classList.remove("cs-card--tall")
      })
    }
  }, [ref])
}
