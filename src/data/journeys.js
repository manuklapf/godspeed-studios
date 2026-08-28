/* ─────────────────────────────────────────────────────────────────
   Case-study journeys

   Four beats per project — Idea → Problem → Research → Solution — the
   arc a feature actually travels while being built. Rendered by
   CaseStudyJourney.jsx.

   ⚠ The copy below is a first draft written from what each prototype
   visibly does. Replace it with your own account of the work: the beats
   are the structure, not the words. Media entries without a `src` render
   as labelled placeholders — drop a file in /public and add the path.
   ───────────────────────────────────────────────────────────────── */

export const marketplaceJourney = [
  {
    title: "Idea",
    lead: "A resale marketplace where the clothes do the talking. Online shopping is mostly visual and impulsive so the interface should get out of the way and let a wall of garments carry the browsing.",
    points: [
      "Peer-to-peer resale, simple layout, one product at a time",
      "Image-first: the grid is the product, not a list view with pictures attached",
      "Everything reachable without leaving the wall",
    ],
    media: [
      {
        label: "Early concept",
        caption: "First concept made in figma",
        ratio: "45 / 32",
        src: "/marketplace-frames/concept.webp",
      },
      {
        label: "Early concept – Sidebar",
        caption: "First Concept – Sidebar",
        ratio: "45 / 32",
        src: "/marketplace-frames/concept-sidebar.webp",
      },
    ],
  },
  {
    title: "Problem",
    lead: "A dense image wall fights itself. Every control (categories, filters, cart) wants space the products are already using. The density that makes browsing feel good on a large screen turns unreadable on a small one.",
    points: [
      "Categories need to be reachable but not permanently parked on screen",
      "Filtering and the cart both interrupt browsing if they take you elsewhere",
      "One fixed grid density can't serve both scanning and close inspection",
    ],
    media: [
      {
        label: "Annotated problem map",
        caption: "Desktop Design Problem Annotations",
        ratio: "45 / 32",
        src: "/marketplace-frames/concept-annotation.webp",
      },
      {
        label: "Annotated problems – Mobile",
        caption: "Mobile Design Problem Annotations",
        ratio: "16 / 35",
        src: "/marketplace-frames/concept-annotation-mobile.webp",
      },
    ],
  },
  {
    title: "Research",
    lead: "The layout questions were settled in Figma before any of it was built.",
    points: [
      "Category navigation as a panel that pushes the grid aside rather than covering it",
      "Filter and cart as overlays anchored to the control that opened them",
      "A density control, so the reader picks how much fits on screen",
      "Mobile explored as its own layout, not a squeezed desktop",
    ],
    /* Ratios are the artwork's native ones — .js-frame crops with
       object-fit: cover, so anything else cuts the screen off. Desktop
       exports are 5760×4096, mobile 1608×3496; the mobile pair is marked
       narrow so a portrait screen doesn't tower over the rest. */
    media: [
      {
        label: "Category Sidebar",
        caption: "Navigation panel pushing the grid aside",
        src: "/marketplace-frames/sidebar.webp",
        ratio: "45 / 32",
      },
      {
        label: "Product Detail",
        caption: "A single piece, wall still behind it",
        src: "/marketplace-frames/detail.webp",
        ratio: "45 / 32",
      },
    ],
  },
  {
    title: "Solution",
    lead: "The prototype is the result, running as a Proof of Concept. The sidebar slides in beside the grid instead of over it, filter and cart open as bubbles from the control you pressed, and the slider changes how many pieces sit in a row.",
    points: [
      "Collapsible category sidebar with expandable sections",
      "Filter and cart overlays that keep the grid visible",
      "Live density slider from sparse to tightly packed",
      "Everything reachable without the product wall ever being blocked",
    ],
    media: [
      {
        label: "Overview",
        caption: "The archive wall at default density",
        src: "/marketplace-frames/overview.webp",
        ratio: "45 / 32",
      },
    ],
    slot: "prototype",
  },
]

/* RETIRED — the Reservation System has no page of its own any more: its
   droplet opens the live demo directly (see `externalUrl` in portfolio.js).
   Kept the way caseStudies[1] is kept in portfolio.js, so the writing is
   here if the case study ever gets a page back. Nothing imports it. */
export const reservationJourney = [
  {
    title: "Idea",
    lead: "A booking tool built around the floor plan rather than a list of times. A restaurant's real constraint is which table is free and for how long, so the room itself should be the interface — for the guest picking a slot and for the staff working the shift.",
    points: [
      "One view that serves both the booking guest and the front-of-house team",
      "Tables and time as the primary axes, not a form to fill in",
      "Fast enough to use mid-service, on whatever device is at the pass",
    ],
    media: [
      {
        label: "Concept — floor plan as interface",
        caption: "The room as the booking surface",
        ratio: "16 / 10",
      },
    ],
  },
  {
    title: "Problem",
    lead: "Availability is not a simple yes or no. A table is free at seven but not for two hours; a party of six can be seated by joining two fours; a fifteen-minute overrun cascades through the rest of the evening. A booking flow that hides this either overbooks the room or leaves it half empty.",
    points: [
      "Turn times vary by party size, so a slot's length isn't fixed",
      "Combining and splitting tables changes what capacity even means",
      "Staff edit bookings under pressure — every extra step is one taken during service",
    ],
    media: [
      {
        label: "Availability edge cases",
        caption: "Where a simple slot model breaks down",
        ratio: "16 / 10",
      },
    ],
  },
  {
    title: "Research",
    lead: "Prototyped as a working build rather than static screens, because the questions here are about timing and interaction — whether a slot reads as available at a glance, and whether a change can be made in one gesture. Those only answer honestly when you can click them.",
    points: [
      "Timeline against floor plan, tested for how quickly a free slot is spotted",
      "Direct manipulation for moving and resizing a booking",
      "Conflicts surfaced at the moment of the change, not on submit",
      "Touch targets sized for a phone held one-handed during service",
    ],
    media: [
      {
        label: "Prototype iterations",
        caption: "Timeline and floor-plan passes",
        ratio: "16 / 9",
      },
      {
        label: "Interaction states",
        caption: "Moving, resizing, conflicts",
        ratio: "16 / 9",
      },
    ],
  },
  {
    title: "Solution",
    lead: "A live demo you can book against. Pick a party size and a time and the room answers immediately — what's free, what it would take to seat you, and what the change does to the rest of the evening.",
    points: [
      "Live availability driven by real turn times",
      "Bookings created, moved and cancelled in place",
      "Conflicts flagged as they happen rather than after the fact",
      "Runs in the browser — no sign-up to try it",
    ],
    slot: "demo",
  },
]
