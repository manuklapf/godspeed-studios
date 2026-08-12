/* ─────────────────────────────────────────────────────────────────
   PORTFOLIO DATA

   Each entry in `allDroplets` is assigned to a GLB waterdrop mesh
   in the order they are traversed (bottom → top of beanstalk).
   The array order here must match the physical order of WaterDrop
   meshes in beanstalk.glb.

   Fields used in the 3D scene (speech bubble on hover):
     tag, title, bubbleLabel, year, type, route

   Fields used on the case-study / detail pages:
     tag, title, subtitle, description, link, year, bubbleLabel
   ───────────────────────────────────────────────────────────────── */

export const caseStudies = [
  {
    id: "cs-0",
    type: "case-study",
    tag: "Case Study",
    title: "Second-Hand Marketplace",
    bubbleLabel: "Marketplace UI/UX",
    description:
      "A full UI/UX case study for a peer-to-peer resale platform — from discovery research through to high-fidelity Figma prototypes.",
    link: null,
    year: "2025",
  },
  {
    /* TEMPORARILY HIDDEN — not listed in `allDroplets` below.
       To re-enable: put it back in allDroplets with route "/fashion-campaign"
       and un-comment the route in main.jsx. */
    id: "cs-1",
    type: "case-study",
    tag: "Case Study",
    title: "Fashion Campaign",
    description:
      "A conceptual fashion campaign exploring texture, form, and identity through 3D art direction and physical-digital object design.",
    link: null,
    year: "2024",
  },
  {
    id: "cs-2",
    type: "case-study",
    tag: "Case Study",
    title: "Cloud Commerce Platform",
    description:
      "End-to-end UX redesign of an e-commerce checkout flow, increasing conversion by 34% through simplified interactions and motion feedback.",
    link: "https://your-project-link.com",
    year: "2023",
  },
  {
    id: "cs-3",
    type: "case-study",
    tag: "Case Study",
    title: "Immersive Data Story",
    description:
      "Interactive data-journalism piece combining scrollytelling, custom WebGL visualisations, and narrative design for a newsroom.",
    link: "https://your-project-link.com",
    year: "2023",
  },
  {
    id: "cs-4",
    type: "case-study",
    tag: "Live Demo",
    title: "Reservation System",
    bubbleLabel: "Reservation System",
    description: "A booking and table-management tool — live interactive demo.",
    link: "https://reservation-system-ten-tau.vercel.app/demo",
    year: "2026",
  },
]

export const references = [
  {
    id: "ref-1",
    type: "reference",
    tag: "Reference",
    title: "Jane Doe",
    subtitle: "Senior Product Designer · Acme Corp",
    description:
      '"An extraordinarily talented designer who combines sharp strategic thinking with beautiful craft. A true pleasure to work with."',
    link: "https://linkedin.com",
    year: "",
  },
  {
    id: "ref-2",
    type: "reference",
    tag: "Reference",
    title: "John Smith",
    subtitle: "CTO · GreenLeaf Startup",
    description:
      '"Brought our product to life with elegance and precision. Their ability to translate complex problems into intuitive experiences is rare."',
    link: "https://linkedin.com",
    year: "",
  },
]

/* ─────────────────────────────────────────────────────────────────
   All droplets in scene order (bottom → top of beanstalk).
   Index 0 = the lowest GLB WaterDrop mesh, index N = the highest.
   ───────────────────────────────────────────────────────────────── */
export const allDroplets = [
  {
    ...references[0],
    route: "/video-photography",
    bubbleLabel: "Video & Photography Work",
  },
  /* Fashion Campaign (caseStudies[1], route "/fashion-campaign") is hidden
     for now — swapped out for the Reservation System demo. */
  {
    ...caseStudies[4],
    externalUrl:
      "https://reservation-system-92matouia-manuklapfs-projects.vercel.app/demo",
  },
  { ...caseStudies[0], route: "/marketplace-case-study" },
]
