import React from 'react'
import './styles/App.css'

const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>HTML to PPTX Converter</h1>
        <p>Transform HTML content into PowerPoint presentations</p>
      </header>
      <main className="app-main">
        <p>Welcome to the HTML to PPTX Converter. Upload HTML content to get started.</p>
      </main>
      <footer className="app-footer">
        <p>HTML to PPTX Converter - Built with React, TypeScript, and PptxGenJS</p>
      </footer>
    </div>
  )
}

export default App