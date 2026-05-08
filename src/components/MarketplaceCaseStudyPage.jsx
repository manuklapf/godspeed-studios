import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from './PageWrapper'

const ITEMS = [
  'Frame 2', 'Frame 3', 'Frame 4', 'Frame 5', 'Frame 6',
  'Frame 7', 'Frame 8', 'Frame 9', 'Frame 10', 'Frame 11',
  'Frame 12', 'Frame 13', 'Frame 14', 'Frame 15', 'Frame 16',
  'Frame 17', 'Frame 18', 'Frame 19', 'Frame 20', 'Frame 21',
  'Frame 22', 'Frame 23', 'Frame 24', 'Frame 25', 'Frame 26',
].map((name, i) => ({ id: i, src: `/marketplace/${name}.webp` }))

const CATEGORIES = [
  {
    label: 'Clothing',
    items: ['All', 'Outerwear', 'Tops & Shirts', 'Bottoms', 'Socks & Underwear', 'Activewear', 'Swimwear', 'Sleepwear', 'Others'],
  },
  { label: 'Headwear', items: [] },
  { label: 'Shoes', items: [] },
  { label: 'Accessories', items: [] },
  { label: 'Home Goods', items: [] },
  { label: 'Sports', items: [] },
]

const FOOTER_LINKS = [['About', 'Contact', 'Impressum'], ['Shipping', 'Privacy', 'Terms']]

const DESIGN_FRAMES = [
  {
    id: '01',
    src: '/marketplace-frames/overview.webp',
    label: 'Overview',
    desc: 'Default grid view — 5 columns, floating nav, zoom control',
    type: 'desktop',
  },
  {
    id: '02',
    src: '/marketplace-frames/sidebar.webp',
    label: 'Category Sidebar',
    desc: 'Slide-in panel with expandable clothing categories and sub-items',
    type: 'desktop',
  },
  {
    id: '03',
    src: '/marketplace-frames/zoom.webp',
    label: 'Zoomed View',
    desc: 'Fewer columns give each listing more visual weight and detail',
    type: 'desktop',
  },
  {
    id: '04',
    src: '/marketplace-frames/detail.webp',
    label: 'Product Detail',
    desc: 'Individual listing with image carousel, condition tags, and buy actions',
    type: 'desktop',
  },
  {
    id: '05',
    src: '/marketplace-frames/mobile-overview.webp',
    label: 'Mobile Overview',
    desc: 'Condensed 3-column grid with round floating controls',
    type: 'mobile',
  },
  {
    id: '06',
    src: '/marketplace-frames/mobile-detail.webp',
    label: 'Mobile Detail',
    desc: 'Full-bleed product view optimised for one-handed navigation',
    type: 'mobile',
  },
]

function ChevronDown() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ChevronRight() {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
      <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function MarketplaceCaseStudyPage() {
  const [zoom, setZoom] = useState(50)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openCat, setOpenCat] = useState('Clothing')
  const [filterOpen, setFilterOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [lightbox, setLightbox] = useState(null) // index into DESIGN_FRAMES

  const navigate = useNavigate()
  const handleBack = () => {
    document.querySelector('.page-fade-overlay')?.classList.remove('faded')
    setTimeout(() => navigate('/'), 700)
  }

  const openLightbox = (idx) => setLightbox(idx)
  const closeLightbox = () => setLightbox(null)
  const prevFrame = () => setLightbox(i => (i - 1 + DESIGN_FRAMES.length) % DESIGN_FRAMES.length)
  const nextFrame = () => setLightbox(i => (i + 1) % DESIGN_FRAMES.length)

  const toggleFilter = () => { setFilterOpen(o => !o); setCartOpen(false) }
  const toggleCart   = () => { setCartOpen(o => !o);   setFilterOpen(false) }

  // zoom 0 → 8 cols, zoom 100 → 2 cols
  const cols = Math.max(2, Math.round(8 - (zoom / 100) * 6))

  return (
    <PageWrapper>
      <section className="cs-page">

        <header className="cs-header">
          <span className="cs-tag">Case Study</span>
          <h1 className="cs-title">Second-Hand<br />Marketplace</h1>
          <p className="cs-subtitle">
            A UI/UX case study for a peer-to-peer resale platform — from
            research through to high-fidelity Figma prototypes.
          </p>
          <button className="cs-back-btn" onClick={handleBack}>
            ← Back to the Garden
          </button>
        </header>

        {/* ── Design Frames Showcase ────────────────────────── */}
        <div className="cs-frames">
          <div className="cs-frames-hd">
            <span className="cs-frames-eyebrow">Figma Prototype</span>
            <h2 className="cs-frames-title">Design Explorations</h2>
            <p className="cs-frames-sub">Before building the interactive prototype, the full UI was designed in Figma — exploring layout, navigation patterns, and mobile responsiveness across all key screens.</p>
          </div>

          <div className="cs-frames-desktop">
            {DESIGN_FRAMES.filter(f => f.type === 'desktop').map((frame, i) => (
              <div key={frame.id} className="cs-frame-card" onClick={() => openLightbox(DESIGN_FRAMES.indexOf(frame))} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && openLightbox(DESIGN_FRAMES.indexOf(frame))}>
                <div className="cs-frame-img-wrap cs-frame-img-wrap--desktop">
                  <img src={frame.src} alt={frame.label} loading="lazy" draggable={false} />
                  <div className="cs-frame-hover-hint">View</div>
                </div>
                <div className="cs-frame-meta">
                  <span className="cs-frame-num">{frame.id}</span>
                  <div>
                    <p className="cs-frame-label">{frame.label}</p>
                    <p className="cs-frame-desc">{frame.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cs-frames-mobile">
            {DESIGN_FRAMES.filter(f => f.type === 'mobile').map((frame, i) => (
              <div key={frame.id} className="cs-frame-card cs-frame-card--mobile" onClick={() => openLightbox(DESIGN_FRAMES.indexOf(frame))} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && openLightbox(DESIGN_FRAMES.indexOf(frame))}>
                <div className="cs-frame-img-wrap cs-frame-img-wrap--mobile">
                  <img src={frame.src} alt={frame.label} loading="lazy" draggable={false} />
                  <div className="cs-frame-hover-hint">View</div>
                </div>
                <div className="cs-frame-meta">
                  <span className="cs-frame-num">{frame.id}</span>
                  <div>
                    <p className="cs-frame-label">{frame.label}</p>
                    <p className="cs-frame-desc">{frame.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Lightbox ───────────────────────────────── */}
        {lightbox !== null && (
          <div className="cs-lb-backdrop" onClick={closeLightbox}>
            <button className="cs-lb-close" onClick={closeLightbox} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="cs-lb-arrow cs-lb-arrow--prev" onClick={e => { e.stopPropagation(); prevFrame() }} aria-label="Previous">
              <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
                <path d="M9 1L1 9l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="cs-lb-content" onClick={e => e.stopPropagation()}>
              <img
                src={DESIGN_FRAMES[lightbox].src}
                alt={DESIGN_FRAMES[lightbox].label}
                className="cs-lb-img"
              />
              <div className="cs-lb-meta">
                <span className="cs-lb-num">{DESIGN_FRAMES[lightbox].id}</span>
                <span className="cs-lb-label">{DESIGN_FRAMES[lightbox].label}</span>
                <span className="cs-lb-desc">{DESIGN_FRAMES[lightbox].desc}</span>
              </div>
            </div>
            <button className="cs-lb-arrow cs-lb-arrow--next" onClick={e => { e.stopPropagation(); nextFrame() }} aria-label="Next">
              <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
                <path d="M1 1l8 8-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Marketplace UI Mockup ──────────────────────────── */}
        <div className="cs-prototype-hd">
          <span className="cs-frames-eyebrow">Interactive</span>
          <h2 className="cs-frames-title">Prototype</h2>
        </div>
        <div className="mk-section">
          <div className="mk-device">

            {/* ── Sidebar ───────────────────────────────────────── */}
            <div className={`mk-sidebar${sidebarOpen ? ' open' : ''}`}>
              <div className="mk-sb-inner">
                <nav className="mk-sb-cats">
                  {CATEGORIES.map(cat => (
                    <div key={cat.label} className="mk-sb-cat">
                      <button
                        className="mk-sb-cat-hd"
                        onClick={() => setOpenCat(openCat === cat.label ? null : cat.label)}
                      >
                        <span>{cat.label}</span>
                        {cat.items.length > 0
                          ? (openCat === cat.label ? <ChevronDown /> : <ChevronRight />)
                          : <ChevronRight />}
                      </button>
                      {cat.items.length > 0 && openCat === cat.label && (
                        <ul className="mk-sb-items">
                          {cat.items.map(item => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </nav>
                <footer className="mk-sb-footer">
                  {FOOTER_LINKS.map((row, i) => (
                    <div key={i} className="mk-sb-footer-row">
                      {row.map(link => <span key={link}>{link}</span>)}
                    </div>
                  ))}
                </footer>
              </div>
            </div>

            {/* ── Main content (grid + overlays) ────────────────── */}
            <div className="mk-content">

              {/* Scrollable image grid */}
              <div className="mk-scroll">
                <div className="mk-grid" style={{ '--mk-cols': cols }}>
                  {ITEMS.map(item => (
                    <div key={item.id} className="mk-cell">
                      <img src={item.src} alt="" loading="lazy" draggable={false} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating nav bar */}
              <nav className="mk-nav">
                <button
                  className="mk-icon-btn"
                  aria-label="Toggle panels"
                  onClick={() => setSidebarOpen(o => !o)}
                >
                  <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.25 0.75V18.75M2.91667 0.75H18.0833C19.28 0.75 20.25 1.64543 20.25 2.75V16.75C20.25 17.8546 19.28 18.75 18.0833 18.75H2.91667C1.72005 18.75 0.75 17.8546 0.75 16.75V2.75C0.75 1.64543 1.72005 0.75 2.91667 0.75Z" stroke="white" strokeOpacity="0.9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <span className="mk-brand">ARCHIIVE</span>
                <div className="mk-nav-right">
                  <button className="mk-icon-btn" aria-label="Filter" onClick={toggleFilter}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: 'scale(1.4)' }}>
                      <line x1="2" y1="4.5" x2="16" y2="4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <line x1="4.5" y1="9" x2="13.5" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <line x1="7" y1="13.5" x2="11" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <div className="mk-search-bar">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                      <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <input className="mk-search-input" placeholder="" aria-label="Search" readOnly />
                  </div>
                  <button className="mk-search-btn" aria-label="Search">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: 'scale(1.4)' }}>
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                      <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </nav>

              {/* Floating bottom controls */}
              <div className="mk-bottom">
                <button className="mk-cart-btn" aria-label="Shopping cart" onClick={toggleCart}>
                  <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.75 0.75H4.08333L6.31667 11.9083C6.39287 12.292 6.60159 12.6366 6.90629 12.8819C7.21099 13.1272 7.59225 13.2575 7.98333 13.25H16.0833C16.4744 13.2575 16.8557 13.1272 17.1604 12.8819C17.4651 12.6366 17.6738 12.292 17.75 11.9083L19.0833 4.91667H4.91667M8.25 17.4167C8.25 17.8769 7.8769 18.25 7.41667 18.25C6.95643 18.25 6.58333 17.8769 6.58333 17.4167C6.58333 16.9564 6.95643 16.5833 7.41667 16.5833C7.8769 16.5833 8.25 16.9564 8.25 17.4167ZM17.4167 17.4167C17.4167 17.8769 17.0436 18.25 16.5833 18.25C16.1231 18.25 15.75 17.8769 15.75 17.4167C15.75 16.9564 16.1231 16.5833 16.5833 16.5833C17.0436 16.5833 17.4167 16.9564 17.4167 17.4167Z" stroke="white" strokeOpacity="0.9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="mk-zoom-pill">
                  <svg width="10" height="40" viewBox="0 0 10 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line y1="20" x2="10" y2="20" stroke="white" strokeOpacity="0.9" strokeWidth="2"/>
                  </svg>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    className="mk-range"
                    aria-label="Zoom"
                  />
                  <svg width="10" height="40" viewBox="0 0 10 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line y1="20" x2="10" y2="20" stroke="white" strokeOpacity="0.9" strokeWidth="2"/>
                    <line x1="5" y1="15" x2="5" y2="25" stroke="white" strokeOpacity="0.9" strokeWidth="2"/>
                  </svg>
                </div>
              </div>

              {/* Backdrop — closes overlays on outside click */}
              {(filterOpen || cartOpen) && (
                <div className="mk-backdrop" onClick={() => { setFilterOpen(false); setCartOpen(false) }} />
              )}

              {/* ── Filter overlay ──────────────────────────── */}
              <div className={`mk-overlay mk-filter-overlay${filterOpen ? ' open' : ''}`}>
                <div className="mk-ov-inner">
                  <div className="mk-ov-header">
                    <span className="mk-ov-title">Filter</span>
                  </div>

                  <div className="mk-ov-scroll">
                    <div className="mk-ov-section">
                      <p className="mk-ov-label">Sort by</p>
                      <div className="mk-ov-chips">
                        {['Recent', 'Price ↑', 'Price ↓', 'Popular'].map(s => (
                          <button key={s} className="mk-chip">{s}</button>
                        ))}
                      </div>
                    </div>

                    <div className="mk-ov-section">
                      <p className="mk-ov-label">Condition</p>
                      <div className="mk-ov-chips">
                        {['All', 'New', 'Like New', 'Good', 'Fair'].map(c => (
                          <button key={c} className="mk-chip">{c}</button>
                        ))}
                      </div>
                    </div>

                    <div className="mk-ov-section">
                      <p className="mk-ov-label">Category</p>
                      <div className="mk-ov-chips">
                        {['Clothing', 'Shoes', 'Accessories', 'Headwear', 'Home Goods'].map(c => (
                          <button key={c} className="mk-chip">{c}</button>
                        ))}
                      </div>
                    </div>

                    <div className="mk-ov-section">
                      <p className="mk-ov-label">Price range</p>
                      <div className="mk-ov-price-row">
                        <span className="mk-ov-price-val">€0</span>
                        <input type="range" className="mk-ov-range" defaultValue={60} />
                        <span className="mk-ov-price-val">€500+</span>
                      </div>
                    </div>
                  </div>

                  <button className="mk-ov-apply">Apply filters</button>
                </div>
              </div>

              {/* ── Cart overlay ────────────────────────────── */}
              <div className={`mk-overlay mk-cart-overlay${cartOpen ? ' open' : ''}`}>
                <div className="mk-ov-inner">
                  <div className="mk-ov-header">
                    <span className="mk-ov-title">Cart (3)</span>
                  </div>

                  <div className="mk-ov-scroll">
                    {[
                      { frame: 'Frame 3',  name: 'Vintage Studded Belt', size: 'M',  price: '€48' },
                      { frame: 'Frame 7',  name: 'Rare Zippo', size: '-',  price: '€62' },
                      { frame: 'Frame 12', name: 'Croc Leather Boots',   size: '42', price: '€130' },
                    ].map(item => (
                      <div key={item.frame} className="mk-cart-item">
                        <img
                          src={`/marketplace/${item.frame}.webp`}
                          alt={item.name}
                          className="mk-cart-thumb"
                        />
                        <div className="mk-cart-info">
                          <span className="mk-cart-name">{item.name}</span>
                          <span className="mk-cart-meta">Size {item.size}</span>
                        </div>
                        <span className="mk-cart-price">{item.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mk-cart-total">
                    <span>Subtotal</span>
                    <span>€240</span>
                  </div>

                  <button className="mk-ov-apply">Checkout</button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </section>
    </PageWrapper>
  )
}
