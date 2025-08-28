import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Header from '../components/Header'
import Hero from '../components/Hero'
import About from '../components/About'
import Projects from '../components/Projects'
import DataManager from '../components/DataManager'
import Wheel from '../components/Wheel'
import Contact from '../components/Contact'
import Info from '../components/Info'

// Main portfolio page component for testing
const MainPage = () => (
  <main>
    <section id="home">
      <Hero />
    </section>
    <section id="about">
      <About />
    </section>
    <section id="projects">
      <Projects />
    </section>
    <section id="data">
      <DataManager />
    </section>
    <section id="wheel">
      <Wheel />
    </section>
    <section id="contact">
      <Contact />
    </section>
  </main>
)

const renderAppWithRoute = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <>
              <Header />
              <MainPage />
            </>
          } />
          <Route path="/info" element={<Info />} />
        </Routes>
      </div>
    </MemoryRouter>
  )
}

describe('App Routing', () => {
  it('renders main page on default route', () => {
    renderAppWithRoute(['/'])
    
    // Should render the main portfolio page
    expect(screen.getByText(/Hi, I am/)).toBeInTheDocument()
    expect(screen.getByText('About Me')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /My Projects/i })).toBeInTheDocument()
  })

  it('renders info page on /info route', () => {
    renderAppWithRoute(['/info'])
    
    // Should render the info page
    expect(screen.getByText('Personal Information')).toBeInTheDocument()
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByText(/Cormac O'Connor/)).toBeInTheDocument()
  })

  it('info page does not show main navigation', () => {
    renderAppWithRoute(['/info'])
    
    // Info page should not show the main header/navigation
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
    expect(screen.queryByText('About')).not.toBeInTheDocument()
    expect(screen.queryByText('Projects')).not.toBeInTheDocument()
  })

  it('main page shows navigation and sections', () => {
    renderAppWithRoute(['/'])
    
    // Main page should show navigation
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
    
    // And main sections
    expect(document.querySelector('#home')).toBeInTheDocument()
    expect(document.querySelector('#about')).toBeInTheDocument()
    expect(document.querySelector('#projects')).toBeInTheDocument()
    expect(document.querySelector('#contact')).toBeInTheDocument()
  })

  it('routes have proper app structure', () => {
    // Test main page
    renderAppWithRoute(['/'])
    expect(document.querySelector('.App')).toBeInTheDocument()
    
    // Test info page  
    renderAppWithRoute(['/info'])
    expect(document.querySelector('.App')).toBeInTheDocument()
  })
})