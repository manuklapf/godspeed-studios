import React, { useRef, useState, useEffect } from "react"
import PageWrapper from "./PageWrapper"
import MarketplacePrototype from "./MarketplacePrototype"
import CaseStudyJourney from "./CaseStudyJourney"
import CaseStudyCTA from "./CaseStudyCTA"
import ModalCloseButton from "./ModalCloseButton"
import { marketplaceJourney } from "../data/journeys"
import { useCardStack } from "../hooks/useCardStack"

const CTA_LABEL = "Open Prototype"

export default function MarketplaceCaseStudyPage() {
  const pageRef = useRef(null)
  useCardStack(pageRef)

  /* The prototype is a component, not a URL, so "open" means a modal over
     the page rather than a route of its own. */
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === "Escape" && setOpen(false)
    /* the page behind must not scroll while the overlay owns the screen */
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const cta = <CaseStudyCTA label={CTA_LABEL} onClick={() => setOpen(true)} />

  return (
    <PageWrapper>
      <section className="cs-page" ref={pageRef}>
        <header className="cs-header">
          <span className="cs-tag">Case Study</span>
          <h1 className="cs-title">
            Second-Hand
            <br />
            Marketplace
          </h1>
          <p className="cs-subtitle">
            A UI/UX case study for a peer-to-peer resale platform. From research
            through to high-fidelity Figma prototypes.
          </p>
          <div className="cs-header-cta">{cta}</div>
        </header>

        {/* Idea / Problem / Research / Solution — the Solution beat carries
            the same button as the header. */}
        <CaseStudyJourney
          steps={marketplaceJourney}
          slots={{ prototype: cta }}
        />
      </section>

      {open && (
        <div
          className="cs-stage"
          role="dialog"
          aria-modal="true"
          aria-label="Marketplace prototype"
          onClick={() => setOpen(false)}
        >
          <ModalCloseButton
            onClose={() => setOpen(false)}
            label="Close prototype"
          />
          <div className="cs-stage-modal" onClick={(e) => e.stopPropagation()}>
            <MarketplacePrototype />
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
