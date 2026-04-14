/* ─────────────────────────────────────────────────────────────────
   PORTFOLIO DATA
   Replace placeholder content and colors with your actual projects.
   For images, add files to /public/images/ and update the `image`
   field with their path (e.g. "/images/project1.jpg").
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
    colorA: '#a8e6cf',
    colorB: '#56c596',
    // image: '/images/project1.jpg',  ← uncomment & add real image
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
    colorA: '#dcedc1',
    colorB: '#8bc34a',
    // image: '/images/project2.jpg',
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
    colorA: '#b3e5fc',
    colorB: '#4fc3f7',
    // image: '/images/project3.jpg',
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
    colorA: '#e1bee7',
    colorB: '#9c27b0',
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
    colorA: '#ffe0b2',
    colorB: '#ff9800',
    year: '',
  },
]

/* All droplets in scene order (bottom → top of beanstalk) */
export const allDroplets = [
  { ...caseStudies[0], stalkT: 0.18, offsetX: 2.4, offsetZ: 0.5 },
  { ...references[0],  stalkT: 0.30, offsetX: -2.6, offsetZ: 0.3 },
  { ...caseStudies[1], stalkT: 0.46, offsetX: 2.2, offsetZ: -0.5 },
  { ...caseStudies[2], stalkT: 0.62, offsetX: -2.4, offsetZ: 0.4 },
  { ...references[1],  stalkT: 0.78, offsetX: 2.0, offsetZ: -0.2 },
]
