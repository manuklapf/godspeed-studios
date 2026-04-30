import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import ProjectPage from './components/ProjectPage.jsx'
import VideoPhotographyPage from './components/VideoPhotographyPage.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/video-photography" element={<VideoPhotographyPage />} />
        <Route path="/*" element={<ProjectPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
