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
    id: 'cs-1',
    type: 'case-study',
    tag: 'Case Study',
    title: 'Ethereal Design System',
    description:
      "A comprehensive design system built for a fintech product. Reduced design-to-dev handoff time by 60% and unified the product's visual language.",
    link: 'https://your-project-link.com',
    year: '2024',
  },
  {
    id: 'cs-2',
    type: 'case-study',
    tag: 'Case Study',
    title: 'Cloud Commerce Platform',
    description:
      "End-to-end UX redesign of an e-commerce checkout flow, increasing conversion by 34% through simplified interactions and motion feedback.",
    link: 'https://your-project-link.com',
    year: '2023',
  },
  {
    id: 'cs-3',
    type: 'case-study',
    tag: 'Case Study',
    title: 'Immersive Data Story',
    description:
      "Interactive data-journalism piece combining scrollytelling, custom WebGL visualisations, and narrative design for a newsroom.",
    link: 'https://your-project-link.com',
    year: '2023',
  },
]

export const references = [
  {
    id: 'ref-1',
    type: 'reference',
    tag: 'Reference',
    title: 'Jane Doe',
    subtitle: 'Senior Product Designer · Acme Corp',
    description:
      "\"An extraordinarily talented designer who combines sharp strategic thinking with beautiful craft. A true pleasure to work with.\"",
    link: 'https://linkedin.com',
    year: '',
  },
  {
    id: 'ref-2',
    type: 'reference',
    tag: 'Reference',
    title: 'John Smith',
    subtitle: 'CTO · GreenLeaf Startup',
    description:
      "\"Brought our product to life with elegance and precision. Their ability to translate complex problems into intuitive experiences is rare.\"",
    link: 'https://linkedin.com',
    year: '',
  },
]

/* ─────────────────────────────────────────────────────────────────
   All droplets in scene order (bottom → top of beanstalk).
   Index 0 = the lowest GLB WaterDrop mesh, index N = the highest.
   ───────────────────────────────────────────────────────────────── */
export const allDroplets = [
  { ...caseStudies[0], route: '/project/ethereal-design-system' },
  { ...references[0],  route: '/video-photography', bubbleLabel: 'Video & Photography Work' },
  { ...caseStudies[1], route: '/project/cloud-commerce' },
  { ...caseStudies[2], route: '/project/immersive-data' },
  { ...references[1],  route: '/project/reference' },
]
