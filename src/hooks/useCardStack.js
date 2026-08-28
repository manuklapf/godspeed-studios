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

/* Breathing room left under a card that pins by its tail instead of its head */
const TAIL_GAP = 16

/* Phones keep every card in the stack (see the tall-card handling below) */
const isMobile = () => window.matchMedia("(max-width: 768px)").matches

export function useCardStack(ref) {
  useEffect(() => {
    const root = ref.current
    if (!root) return

    let cards = []
    let restLine = 0
    let frame = null

    const measure = () => {
      const children = Array.from(root.children)
      const mobile = isMobile()

      /* Decided fresh every time: a resize, or an image finally landing, can
         change which cards still fit. */
      children.forEach((el) => {
        el.classList.remove("cs-card--tall")
        el.style.top = ""
      })

      /* `top` is a clamp(), so resolve it off whatever is sticky right now —
         with the inline tops above cleared, this reads the stylesheet's line */
      const pinned = children.find(
        (el) => getComputedStyle(el).position === "sticky",
      )
      restLine = pinned ? parseFloat(getComputedStyle(pinned).top) || 0 : 0

      /* A card taller than the room under the rest line can't pin by its head:
         it would hold its title in place with its tail below the fold and then
         be covered by the next card, so its end could never be read.

         On a phone nearly every card is that tall, and dropping them from the
         stack left the page transitioning two different ways. So instead they
         pin by their tail — the card scrolls until its end sits just above the
         bottom of the screen, then holds there and takes the same slide-over
         fade as any other card. Wider screens keep the plain scroll, where a
         card that overflows is the exception rather than the rule. */
      const room = window.innerHeight - restLine
      children.forEach((el) => {
        if (getComputedStyle(el).position !== "sticky") return
        const height = el.getBoundingClientRect().height
        if (height <= room) return
        if (mobile) {
          el.style.top = `${Math.min(
            restLine,
            window.innerHeight - height - TAIL_GAP,
          )}px`
        } else {
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
        /* Distance the incoming card's top edge still has to fall before it
           sits on the resting line — at 0 this card is covered. Measured
           against the stylesheet's line even for a tail-pinned card, whose
           own top edge is above the fold by then: what matters is where the
           card coming over it lands. */
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
        card.style.top = ""
        card.classList.remove("cs-card--tall")
      })
    }
  }, [ref])
}
