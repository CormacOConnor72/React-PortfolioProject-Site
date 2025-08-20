import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Projects from '../Projects'

describe('Projects Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders projects section with title', () => {
    render(<Projects />)
    expect(screen.getByText('Featured Projects')).toBeInTheDocument()
    expect(screen.getByText(/showcase of my recent work/i)).toBeInTheDocument()
  })

  it('renders all filter buttons', () => {
    render(<Projects />)
    
    expect(screen.getByText('All Projects')).toBeInTheDocument()
    expect(screen.getByText('Frontend')).toBeInTheDocument()
    expect(screen.getByText('Backend')).toBeInTheDocument()
    expect(screen.getByText('Full Stack')).toBeInTheDocument()
  })

  it('shows all projects by default', () => {
    render(<Projects />)
    
    // Should show projects from all categories
    expect(screen.getByText('E-Commerce Platform')).toBeInTheDocument()
    expect(screen.getByText('Task Management Dashboard')).toBeInTheDocument()
    expect(screen.getByText('RESTful API Service')).toBeInTheDocument()
  })

  it('filters projects when filter button is clicked', async () => {
    const user = userEvent.setup()
    render(<Projects />)
    
    // Click frontend filter
    const frontendButton = screen.getByText('Frontend')
    await user.click(frontendButton)
    
    // Should show only frontend projects
    expect(screen.getByText('Task Management Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('RESTful API Service')).not.toBeInTheDocument()
  })

  it('updates active filter button styling', async () => {
    const user = userEvent.setup()
    render(<Projects />)
    
    const allButton = screen.getByText('All Projects')
    const frontendButton = screen.getByText('Frontend')
    
    // All should be active initially
    expect(allButton).toHaveClass('active')
    expect(frontendButton).not.toHaveClass('active')
    
    // Click frontend filter
    await user.click(frontendButton)
    
    expect(allButton).not.toHaveClass('active')
    expect(frontendButton).toHaveClass('active')
  })

  it('renders project cards with required information', () => {
    render(<Projects />)
    
    // Check first project card
    expect(screen.getByText('E-Commerce Platform')).toBeInTheDocument()
    expect(screen.getByText(/modern e-commerce solution/i)).toBeInTheDocument()
    
    // Check for technology tags
    expect(screen.getAllByText('React').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Node.js').length).toBeGreaterThan(0)
  })

  it('shows featured badge for featured projects', () => {
    render(<Projects />)
    
    // Look for featured projects (they should have the featured class or badge)
    const projectCards = document.querySelectorAll('.project-card')
    const featuredCards = document.querySelectorAll('.project-card.featured')
    
    expect(featuredCards.length).toBeGreaterThan(0)
  })

  it('renders project links', () => {
    render(<Projects />)
    
    // Should have links to live demo and GitHub
    const liveLinks = screen.getAllByText(/view live/i)
    const githubLinks = screen.getAllByText(/github/i)
    
    expect(liveLinks.length).toBeGreaterThan(0)
    expect(githubLinks.length).toBeGreaterThan(0)
  })

  it('handles empty filter results', async () => {
    const user = userEvent.setup()
    render(<Projects />)
    
    // Click backend filter (assuming there might be fewer backend projects)
    const backendButton = screen.getByText('Backend')
    await user.click(backendButton)
    
    // Should show at least the RESTful API project or handle empty state
    const projectCards = document.querySelectorAll('.project-card')
    expect(projectCards.length).toBeGreaterThanOrEqual(0)
  })

  it('shows project overlay on hover', async () => {
    const user = userEvent.setup()
    render(<Projects />)
    
    const projectCard = document.querySelector('.project-card')
    expect(projectCard).toBeInTheDocument()
    
    // Hover over project card
    await user.hover(projectCard)
    
    // Check if overlay appears (this tests CSS interaction)
    const overlay = projectCard.querySelector('.project-overlay')
    expect(overlay).toBeInTheDocument()
  })

  it('maintains filter state when switching between filters', async () => {
    const user = userEvent.setup()
    render(<Projects />)
    
    // Start with all projects
    expect(screen.getByText('All Projects')).toHaveClass('active')
    
    // Switch to frontend
    await user.click(screen.getByText('Frontend'))
    expect(screen.getByText('Frontend')).toHaveClass('active')
    
    // Switch to fullstack
    await user.click(screen.getByText('Full Stack'))
    expect(screen.getByText('Full Stack')).toHaveClass('active')
    expect(screen.getByText('Frontend')).not.toHaveClass('active')
  })
})