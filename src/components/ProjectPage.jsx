import React from 'react'
import { useLocation } from 'react-router-dom'
import { allDroplets } from '../data/portfolio'
import PageWrapper from './PageWrapper'

export default function ProjectPage() {
  const location = useLocation()
  const data = allDroplets.find((d) => d.route === location.pathname)

  return (
    <PageWrapper>
      {data ? (
        <div className="project-content">
          <span className="project-tag">{data.tag}</span>
          <h1 className="project-title">{data.bubbleLabel || data.title}</h1>
          {data.subtitle && <p className="project-subtitle">{data.subtitle}</p>}
          {data.year && <p className="project-year">{data.year}</p>}
          <p className="project-description">{data.description}</p>
          {data.link && (
            <a
              className="project-link"
              href={data.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {data.type === 'reference' ? 'View profile →' : 'View project →'}
            </a>
          )}
        </div>
      ) : (
        <div className="project-content">
          <h1 className="project-title">Coming Soon</h1>
          <p className="project-description">This page is still being built.</p>
        </div>
      )}
    </PageWrapper>
  )
}
