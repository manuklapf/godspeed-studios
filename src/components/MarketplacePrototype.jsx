import React, { useState } from "react"
import LoadingScreen from "./LoadingScreen"
import { useMediaPreload } from "../hooks/useMediaPreload"

const ITEMS = [
  "Frame 2",
  "Frame 3",
  "Frame 4",
  "Frame 5",
  "Frame 6",
  "Frame 7",
  "Frame 8",
  "Frame 9",
  "Frame 10",
  "Frame 11",
  "Frame 12",
  "Frame 13",
  "Frame 14",
  "Frame 15",
  "Frame 16",
  "Frame 17",
  "Frame 18",
  "Frame 19",
  "Frame 20",
  "Frame 21",
  "Frame 22",
  "Frame 23",
  "Frame 24",
  "Frame 25",
  "Frame 26",
].map((name, i) => ({ id: i, src: `/marketplace/${name}.webp` }))

/* Also read by App, which warms these in the background while the reader is
   still in the garden — by the time the prototype opens they are usually
   already here and the loading screen never shows. */
export const PROTOTYPE_IMAGES = ITEMS.map((item) => item.src)

const CATEGORIES = [
  {
    label: "Clothing",
    items: [
      "All",
      "Outerwear",
      "Tops & Shirts",
      "Bottoms",
      "Socks & Underwear",
      "Activewear",
      "Swimwear",
      "Sleepwear",
      "Others",
    ],
  },
  { label: "Headwear", items: [] },
  { label: "Shoes", items: [] },
  { label: "Accessories", items: [] },
  { label: "Home Goods", items: [] },
  { label: "Sports", items: [] },
]

const FOOTER_LINKS = [
  ["About", "Contact", "Impressum"],
  ["Shipping", "Privacy", "Terms"],
]

const FILTER_GROUPS = [
  {
    label: "Sort by",
    options: ["Recent", "Price ↑", "Price ↓", "Popular"],
  },
  { label: "Condition", options: ["All", "New", "Like New", "Good", "Fair"] },
  {
    label: "Category",
    options: ["Clothing", "Shoes", "Accessories", "Headwear", "Home Goods"],
  },
]

const CART_ITEMS = [
  {
    frame: "Frame 3",
    name: "Vintage Studded Belt",
    size: "M",
    price: "€48",
  },
  { frame: "Frame 7", name: "Rare Zippo", size: "-", price: "€62" },
  {
    frame: "Frame 12",
    name: "Croc Leather Boots",
    size: "42",
    price: "€130",
  },
]

function ChevronDown() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path
        d="M1 1l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
      <path
        d="M1 1l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* The interactive marketplace mockup: a device frame owning its own sidebar,
   filter, cart, search and zoom state. Nothing here is shared with the host
   page, so a page just drops it into a card slot. */
export default function MarketplacePrototype() {
  const [zoom, setZoom] = useState(50)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openCat, setOpenCat] = useState("Clothing")
  const [filterOpen, setFilterOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  /* The grid is the prototype — a wall that fills in tile by tile reads as
     broken, so nothing is rendered until every frame is here. */
  const media = useMediaPreload(PROTOTYPE_IMAGES)

  /* filter and cart share the same slot — opening one closes the other */
  const toggleFilter = () => {
    setFilterOpen((o) => !o)
    setCartOpen(false)
  }
  const toggleCart = () => {
    setCartOpen((o) => !o)
    setFilterOpen(false)
  }

  // zoom 0 → 8 cols, zoom 100 → 2 cols
  const cols = Math.max(2, Math.round(8 - (zoom / 100) * 6))

  /* Same box either way, so the modal doesn't resize under the loader */
  if (!media.ready) {
    return (
      <div className="mk-device">
        <LoadingScreen variant="panel" progress={media.progress} />
      </div>
    )
  }

  return (
    <div className="mk-device">
      {/* ── Sidebar ───────────────────────────────────────── */}
      <div className={`mk-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="mk-sb-inner">
          <nav className="mk-sb-cats">
            {CATEGORIES.map((cat) => (
              <div key={cat.label} className="mk-sb-cat">
                <button
                  className="mk-sb-cat-hd"
                  onClick={() =>
                    setOpenCat(openCat === cat.label ? null : cat.label)
                  }
                >
                  <span>{cat.label}</span>
                  {cat.items.length > 0 ? (
                    openCat === cat.label ? (
                      <ChevronDown />
                    ) : (
                      <ChevronRight />
                    )
                  ) : (
                    <ChevronRight />
                  )}
                </button>
                {cat.items.length > 0 && openCat === cat.label && (
                  <ul className="mk-sb-items">
                    {cat.items.map((item) => (
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
                {row.map((link) => (
                  <span key={link}>{link}</span>
                ))}
              </div>
            ))}
          </footer>
        </div>
      </div>

      {/* ── Main content (grid + overlays) ────────────────── */}
      <div className="mk-content">
        {/* Scrollable image grid */}
        <div className="mk-scroll">
          <div className="mk-grid" style={{ "--mk-cols": cols }}>
            {ITEMS.map((item) => (
              <div key={item.id} className="mk-cell">
                <img src={item.src} alt="" draggable={false} />
              </div>
            ))}
          </div>
        </div>

        {/* Floating nav bar */}
        <nav className="mk-nav">
          <button
            className="mk-icon-btn"
            aria-label="Toggle panels"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <svg
              width="21"
              height="20"
              viewBox="0 0 21 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.25 0.75V18.75M2.91667 0.75H18.0833C19.28 0.75 20.25 1.64543 20.25 2.75V16.75C20.25 17.8546 19.28 18.75 18.0833 18.75H2.91667C1.72005 18.75 0.75 17.8546 0.75 16.75V2.75C0.75 1.64543 1.72005 0.75 2.91667 0.75Z"
                stroke="white"
                strokeOpacity="0.9"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="mk-brand">ARCHIIVE</span>
          <div className="mk-nav-right">
            <button
              className="mk-icon-btn"
              aria-label="Filter"
              onClick={toggleFilter}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                style={{ transform: "scale(1.4)" }}
              >
                <line
                  x1="2"
                  y1="4.5"
                  x2="16"
                  y2="4.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <line
                  x1="4.5"
                  y1="9"
                  x2="13.5"
                  y2="9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <line
                  x1="7"
                  y1="13.5"
                  x2="11"
                  y2="13.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div
              className={`mk-search-bar${
                searchOpen ? " mk-search-bar--open" : ""
              }`}
              onClick={() => setSearchOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <line
                  x1="9.5"
                  y1="9.5"
                  x2="13"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              <input
                className="mk-search-input"
                placeholder="Search"
                aria-label="Search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => {
                  if (!searchValue) setSearchOpen(false)
                }}
              />
            </div>
            <button className="mk-search-btn" aria-label="Search">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{ transform: "scale(1.4)" }}
              >
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <line
                  x1="9.5"
                  y1="9.5"
                  x2="13"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </nav>

        {/* Floating bottom controls */}
        <div className="mk-bottom">
          <button
            className="mk-cart-btn"
            aria-label="Shopping cart"
            onClick={toggleCart}
          >
            <svg
              width="20"
              height="19"
              viewBox="0 0 20 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.75 0.75H4.08333L6.31667 11.9083C6.39287 12.292 6.60159 12.6366 6.90629 12.8819C7.21099 13.1272 7.59225 13.2575 7.98333 13.25H16.0833C16.4744 13.2575 16.8557 13.1272 17.1604 12.8819C17.4651 12.6366 17.6738 12.292 17.75 11.9083L19.0833 4.91667H4.91667M8.25 17.4167C8.25 17.8769 7.8769 18.25 7.41667 18.25C6.95643 18.25 6.58333 17.8769 6.58333 17.4167C6.58333 16.9564 6.95643 16.5833 7.41667 16.5833C7.8769 16.5833 8.25 16.9564 8.25 17.4167ZM17.4167 17.4167C17.4167 17.8769 17.0436 18.25 16.5833 18.25C16.1231 18.25 15.75 17.8769 15.75 17.4167C15.75 16.9564 16.1231 16.5833 16.5833 16.5833C17.0436 16.5833 17.4167 16.9564 17.4167 17.4167Z"
                stroke="white"
                strokeOpacity="0.9"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="mk-zoom-pill">
            <svg
              width="10"
              height="40"
              viewBox="0 0 10 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                y1="20"
                x2="10"
                y2="20"
                stroke="white"
                strokeOpacity="0.9"
                strokeWidth="2"
              />
            </svg>
            <input
              type="range"
              min="30"
              max="100"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mk-range"
              aria-label="Zoom"
            />
            <svg
              width="10"
              height="40"
              viewBox="0 0 10 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                y1="20"
                x2="10"
                y2="20"
                stroke="white"
                strokeOpacity="0.9"
                strokeWidth="2"
              />
              <line
                x1="5"
                y1="15"
                x2="5"
                y2="25"
                stroke="white"
                strokeOpacity="0.9"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Backdrop — closes overlays on outside click */}
        {(filterOpen || cartOpen) && (
          <div
            className="mk-backdrop"
            onClick={() => {
              setFilterOpen(false)
              setCartOpen(false)
            }}
          />
        )}

        {/* ── Filter overlay ──────────────────────────── */}
        <div
          className={`mk-overlay mk-filter-overlay${filterOpen ? " open" : ""}`}
        >
          <div className="mk-ov-inner">
            <div className="mk-ov-header">
              <span className="mk-ov-title">Filter</span>
            </div>

            <div className="mk-ov-scroll">
              {FILTER_GROUPS.map((group) => (
                <div key={group.label} className="mk-ov-section">
                  <p className="mk-ov-label">{group.label}</p>
                  <div className="mk-ov-chips">
                    {group.options.map((opt) => (
                      <button key={opt} className="mk-chip">
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mk-ov-section">
                <p className="mk-ov-label">Price range</p>
                <div className="mk-ov-price-row">
                  <span className="mk-ov-price-val">€0</span>
                  <input
                    type="range"
                    className="mk-ov-range"
                    defaultValue={60}
                  />
                  <span className="mk-ov-price-val">€500+</span>
                </div>
              </div>
            </div>

            <button className="mk-ov-apply">Apply filters</button>
          </div>
        </div>

        {/* ── Cart overlay ────────────────────────────── */}
        <div className={`mk-overlay mk-cart-overlay${cartOpen ? " open" : ""}`}>
          <div className="mk-ov-inner">
            <div className="mk-ov-header">
              <span className="mk-ov-title">Cart ({CART_ITEMS.length})</span>
            </div>

            <div className="mk-ov-scroll">
              {CART_ITEMS.map((item) => (
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
  )
}
