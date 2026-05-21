import React, { useState, useEffect } from "react"
import {
  EffectComposer,
  Bloom,
  Pixelation,
  Vignette,
} from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"

/* ──────────────────────────────────────────────────────────────
   Post-processing pipeline

   Order matters:
   1. Bloom   — spreads bright areas outward (glow)
   2. Pixelation — pixelates the final image (low-poly aesthetic)
   3. Vignette — darkens edges (depth / drama)
   ────────────────────────────────────────────────────────────── */
export default function Effects() {
  const [granularity, setGranularity] = useState(
    window.innerWidth < 768 ? 2 : 3,
  )

  useEffect(() => {
    const handleResize = () => {
      setGranularity(window.innerWidth < 768 ? 2 : 3)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <EffectComposer multisampling={0}>
      {/*
        Bloom — makes bright emissive surfaces glow.
        - mipmapBlur gives a softer, more natural bloom spread
        - luminanceThreshold: 0.12 means most things bloom
        - intensity: 1.4 for a strong but not overwhelming glow
      */}
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.32}
        luminanceSmoothing={0.75}
        mipmapBlur
        radius={0.65}
      />

      {/*
        Pixelation — gives the scene a low-poly / game aesthetic.
        granularity 3 = moderate pixel blocks (increase for stronger effect).
      */}
      <Pixelation granularity={granularity} />

      {/*
        Vignette — subtle edge darkening for cinematic depth.
      */}
      <Vignette
        offset={0.22}
        darkness={0.38}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
