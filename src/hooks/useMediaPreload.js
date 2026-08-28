import { useEffect, useMemo, useState } from "react"

/* ──────────────────────────────────────────────────────────────
   useMediaPreload

   Pulls a surface's images and video down in full before the surface is
   shown, so nothing streams in under the reader — no half-painted grid,
   no frame appearing a beat after the card it sits in.

   A page holds a loading screen while `ready` is false. `progress` is a
   0–1 fraction for a bar; it counts files, not bytes, so it is a rough
   read of how far along the set is rather than a true measure.

   Nothing here ever rejects. A dead link, a codec the browser won't take,
   a connection that stalls — none of them may strand a reader on a
   loading screen, so every load resolves either way and the whole set
   gives up after TIMEOUT_MS regardless of what is still outstanding.
   ────────────────────────────────────────────────────────────── */

/* Everything fetched this session. Coming back to a page it already warmed
   skips the loading screen rather than flashing it for a frame. */
const cached = new Set()

const TIMEOUT_MS = 20000

/* Enough requests in flight to use the connection, few enough that a phone
   isn't decoding two dozen full-size photographs at once. */
const CONCURRENCY = 6

const isVideo = (url) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)

/* `decode` rather than plain onload: it resolves when the bitmap is ready
   to paint, which is what "loaded" has to mean for a loading screen to be
   worth holding. Older browsers without it fall back to the load event. */
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image()
    const done = () => resolve()
    img.onload = () => (img.decode ? img.decode().then(done, done) : done())
    img.onerror = done
    img.src = url
  })
}

/* `canplaythrough` — the browser's own word that it can run the file to the
   end without stopping to buffer. */
function loadVideo(url) {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    const done = () => resolve()
    video.preload = "auto"
    video.muted = true
    video.playsInline = true
    video.addEventListener("canplaythrough", done, { once: true })
    video.addEventListener("error", done, { once: true })
    video.src = url
    video.load()
  })
}

function loadOne(url) {
  if (cached.has(url)) return Promise.resolve()
  return (isVideo(url) ? loadVideo(url) : loadImage(url)).then(() => {
    cached.add(url)
  })
}

/* Runs the list CONCURRENCY at a time, calling onEach as they land. */
function loadAll(urls, onEach) {
  let next = 0
  const worker = () => {
    if (next >= urls.length) return Promise.resolve()
    const url = urls[next++]
    return loadOne(url)
      .then(() => onEach && onEach(url))
      .then(worker)
  }
  return Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker),
  )
}

/** Fetch a set of media without holding anything up — used to warm the
 *  pages the reader hasn't opened yet. */
export function prefetchMedia(urls) {
  return loadAll(urls.filter(Boolean))
}

/** True when this connection has asked us not to spend its bandwidth. */
export function connectionIsFrugal() {
  const c = navigator.connection
  if (!c) return false
  return Boolean(c.saveData) || /2g/.test(c.effectiveType || "")
}

export function useMediaPreload(urls) {
  /* Callers build their list inline, so a new array every render — key the
     work off what is in it rather than off the array's identity. */
  const key = urls.join("|")
  const list = useMemo(() => urls.filter(Boolean), [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const [state, setState] = useState(() => {
    const have = list.filter((u) => cached.has(u)).length
    return { ready: have === list.length, loaded: have }
  })

  useEffect(() => {
    const have = list.filter((u) => cached.has(u)).length
    if (have === list.length) {
      setState({ ready: true, loaded: have })
      return
    }

    let alive = true
    let loaded = have
    setState({ ready: false, loaded })

    const finish = () => {
      if (alive) setState({ ready: true, loaded: list.length })
    }
    const timer = setTimeout(finish, TIMEOUT_MS)

    loadAll(list, () => {
      loaded += 1
      if (alive) setState({ ready: false, loaded })
    }).then(() => {
      clearTimeout(timer)
      finish()
    })

    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [list])

  return {
    ready: state.ready,
    loaded: state.loaded,
    total: list.length,
    progress: list.length ? state.loaded / list.length : 1,
  }
}
