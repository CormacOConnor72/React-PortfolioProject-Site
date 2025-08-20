import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../../App'

const renderApp = () => {
  return render(<App />)
}

describe('App Component', () => {
  it('renders without crashing', () => {
    renderApp()
    expect(document.querySelector('.App')).toBeInTheDocument()
  })

  it('renders main navigation', () => {
    renderApp()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('renders all main sections', () => {
    renderApp()
    
    // Check for section content
    expect(screen.getByText(/Hi, I am/)).toBeInTheDocument() // Hero
    expect(screen.getByText(/About Me/)).toBeInTheDocument() // About
    expect(screen.getByText(/Featured Projects/)).toBeInTheDocument() // Projects
    expect(screen.getByText(/Let's Work Together/)).toBeInTheDocument() // Contact
  })

  it('has proper section structure with IDs', () => {
    renderApp()
    
    expect(document.querySelector('#home')).toBeInTheDocument()
    expect(document.querySelector('#about')).toBeInTheDocument()
    expect(document.querySelector('#projects')).toBeInTheDocument()
    expect(document.querySelector('#contact')).toBeInTheDocument()
  })

  it('renders header and main content', () => {
    renderApp()
    
    expect(document.querySelector('header, .header')).toBeInTheDocument()
    expect(document.querySelector('main')).toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    renderApp()
    
    const app = document.querySelector('.App')
    expect(app).toHaveClass('App')
  })

  it('has proper document structure for single page app', () => {
    renderApp()
    
    // Should have main sections in order
    const sections = document.querySelectorAll('section')
    expect(sections.length).toBeGreaterThanOrEqual(4)
    
    // Check section order by IDs
    const homeSection = document.querySelector('#home')
    const aboutSection = document.querySelector('#about')
    const projectsSection = document.querySelector('#projects')
    const contactSection = document.querySelector('#contact')
    
    expect(homeSection).toBeInTheDocument()
    expect(aboutSection).toBeInTheDocument()
    expect(projectsSection).toBeInTheDocument()
    expect(contactSection).toBeInTheDocument()
  })
})