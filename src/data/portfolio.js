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
    id: "cs-1",
    type: "case-study",
    tag: "Case Study",
    title: "Fashion Campaign",
    description:
      "A conceptual fashion campaign exploring texture, form, and identity through 3D art direction and physical-digital object design.",
    link: null,
    year: "2024",
  },
];

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
];

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
  { ...caseStudies[1], route: "/fashion-campaign" },
  { ...caseStudies[0], route: "/marketplace-case-study" },
];
