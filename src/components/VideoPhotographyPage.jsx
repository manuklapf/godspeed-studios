import React, { useState } from 'react'
import PageWrapper from './PageWrapper'

/* ─────────────────────────────────────────────────────────────────
   Media data
   Assets live in /public/ —
     memories_video_16x9.gif, godspeed_video_16x9.gif,
     festival_video_16x9.gif, tokyo_summer_festivals.mp4,
     photography-showcase-{1,2,3,4,10,11,12}.webp
   ───────────────────────────────────────────────────────────────── */
const MEDIA = [
  /* ── Row 1 ─────────────────────────────────────────────────── */
  {
    id: 'memories',
    area: 'topleft',
    type: 'youtube',
    thumb: '/memories_video_16x9.gif',
    embedId: 'b1HWwydB1sM?si=gjEzsHg7T5pmzhYH',
    label: 'Memories',
    sublabel: 'Music Video',
  },
  {
    id: 'photo-12',
    area: 'topright',
    type: 'photo',
    src: '/photography-showcase-12.webp',
  },

  /* ── Row 2 ─────────────────────────────────────────────────── */
  {
    id: 'photo-1',
    area: 'secleft',
    type: 'photo',
    src: '/photography-showcase-1.webp',
  },
  {
    id: 'godspeed',
    area: 'secright',
    type: 'youtube',
    thumb: '/godspeed_video_16x9.gif',
    embedId: 'fE81ziF6JqE?si=D9mlkMeJdYJc7C2j',
    label: 'Godspeed SS22',
    sublabel: 'Fashion Film',
  },

  /* ── Row 3 ─────────────────────────────────────────────────── */
  { id: 'photo-11', area: 'thileft',  type: 'photo', src: '/photography-showcase-11.webp' },
  { id: 'photo-2',  area: 'tmiddle',  type: 'photo', src: '/photography-showcase-2.webp'  },
  { id: 'photo-4',  area: 'tright',   type: 'photo', src: '/photography-showcase-4.webp'  },

  /* ── Row 4 ─────────────────────────────────────────────────── */
  {
    id: 'photo-10',
    area: 'fouleft',
    type: 'photo',
    src: '/photography-showcase-10.webp',
  },
  {
    id: 'festival',
    area: 'foumiddle',
    type: 'video_native',
    thumb: '/festival_video_16x9.gif',
    videoSrc: '/tokyo_summer_festivals.mp4',
    label: 'Tokyo Summer Festivals',
    sublabel: 'Short Film',
  },
  {
    id: 'photo-3',
    area: 'fouright',
    type: 'photo',
    src: '/photography-showcase-3.webp',
  },
]

/* ─────────────────────────────────────────────────────────────────
   Photo cell
   ───────────────────────────────────────────────────────────────── */
function MediaPhoto({ src }) {
  return (
    <div className="mc-photo">
      <img src={src} alt="" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Video cell — shows a looping GIF thumbnail with a play overlay,
   swaps to the actual video/iframe on click
   ───────────────────────────────────────────────────────────────── */
function MediaVideo({ thumb, embedId, videoSrc, label, sublabel }) {
  const [playing, setPlaying] = useState(false)
  const isYouTube = Boolean(embedId)

  return (
    <div
      className={`mc-video${playing ? ' playing' : ''}`}
      onClick={() => { if (!playing) setPlaying(true) }}
    >
      {!playing && (
        <div
          className="mc-thumb"
          style={{ backgroundImage: thumb ? `url(${thumb})` : 'none' }}
        >
          <div className="mc-play-overlay">
            <div className="mc-play-icon">
              {/* Play triangle */}
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                <path d="M1 1L13 8L1 15V1Z" fill="currentColor" />
              </svg>
            </div>
            {label    && <span className="mc-label">{label}</span>}
            {sublabel && <span className="mc-sublabel">{sublabel}</span>}
          </div>
        </div>
      )}

      {playing && isYouTube && (
        <iframe
          className="mc-iframe"
          src={`https://www.youtube.com/embed/${embedId}&autoplay=1`}
          title={label}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}

      {playing && !isYouTube && (
        <video
          className="mc-native-video"
          src={videoSrc}
          autoPlay
          controls
          loop
          playsInline
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────────── */
export default function VideoPhotographyPage() {
  return (
    <PageWrapper>
      <section className="vp-page">

        <header className="vp-header">
          <span className="vp-tag">Work</span>
          <h1 className="vp-title">
            Video &amp;<br />Photography
          </h1>
          <p className="vp-subtitle">
            A selection of film and photography work — music videos,&nbsp;
            fashion films, and stills.
          </p>
        </header>

        <div className="vp-grid">
          {MEDIA.map((item) => (
            <div key={item.id} className={`vp-cell vp-${item.area}`}>
              {item.type === 'photo' ? (
                <MediaPhoto src={item.src} />
              ) : (
                <MediaVideo
                  thumb={item.thumb}
                  embedId={item.embedId}
                  videoSrc={item.videoSrc}
                  label={item.label}
                  sublabel={item.sublabel}
                />
              )}
            </div>
          ))}
        </div>

      </section>
    </PageWrapper>
  )
}
