import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'

/**
 * PageWrapper — reusable shell for every page reached from the beanstalk scene.
 * Handles:
 *   • white-fade-in on mount  (mirrors the zoom-in transition from the scene)
 *   • white-fade-out on back  (reverse transition)
 *   • Navbar
 *   • "Back to the Garden" pill button
 */
export default function PageWrapper({ children }) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  // Reset scroll to top before first paint
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Two rAF frames so the browser has painted the white overlay before we fade
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true))
    )
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleBack = () => {
    setVisible(false)
    setTimeout(() => navigate('/'), 700)
  }

  return (
    <>
      {/* White overlay: opaque on mount → fades out → fades in on back */}
      <div className={`page-fade-overlay${visible ? ' faded' : ''}`} />

      <div className={`beanstalk-page${visible ? ' visible' : ''}`}>
        <Navbar />
        {children}
        <button className="page-back-btn" onClick={handleBack}>
          ← Back to the Garden
        </button>
      </div>
    </>
  )
}
