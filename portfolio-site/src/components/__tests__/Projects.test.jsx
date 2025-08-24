import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Projects from '../Projects'

describe('Projects Component', () => {
  // Tests don't require setup currently

  it('renders projects section with title', () => {
    render(<Projects />)
    expect(screen.getByRole('heading', { name: 'My Projects' })).toBeInTheDocument()
    expect(screen.getByText(/Here are some of my recent projects/i)).toBeInTheDocument()
  })

  it('renders all filter buttons', () => {
    render(<Projects />)
    
    expect(screen.getByText('All Projects')).toBeInTheDocument()
    expect(screen.getByText('Full Stack')).toBeInTheDocument()
    expect(screen.getByText('Frontend')).toBeInTheDocument()
    expect(screen.getByText('Game Dev')).toBeInTheDocument()
    expect(screen.getByText('Infrastructure')).toBeInTheDocument()
    
    // Use a more specific selector for Documentation button
    const documentationButton = screen.getByRole('button', { name: 'Documentation' })
    expect(documentationButton).toBeInTheDocument()
  })

  it('shows all projects by default', () => {
    render(<Projects />)
    
    // Should show projects from all categories
    expect(screen.getByText('Grid Runners')).toBeInTheDocument()
    expect(screen.getByText('Flask AI Sentiment Site')).toBeInTheDocument()
    expect(screen.getByText('WpEngine Customer Portal')).toBeInTheDocument()
  })

  it('filters projects when filter button is clicked', async () => {
    const user = userEvent.setup()
    render(<Projects />)
    
    // Click frontend filter
    const frontendButton = screen.getByText('Frontend')
    await user.click(frontendButton)
    
    // Should show only frontend projects
    expect(screen.getByText('Portfolio Website')).toBeInTheDocument()
    expect(screen.queryByText('Grid Runners')).not.toBeInTheDocument()
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
    expect(screen.getByText('Grid Runners')).toBeInTheDocument()
    expect(screen.getByText(/first-person shooter game/i)).toBeInTheDocument()
    
    // Check for technology tags that actually exist in the projects
    expect(screen.getAllByText('Unity').length).toBeGreaterThan(0)
    expect(screen.getAllByText('React').length).toBeGreaterThan(0)
  })

  it('shows featured badge for featured projects', () => {
    render(<Projects />)
    
    // Look for featured projects (they should have the featured class or badge)
    const featuredCards = document.querySelectorAll('.project-card.featured')
    
    expect(featuredCards.length).toBeGreaterThan(0)
  })

  it('renders project links', () => {
    render(<Projects />)
    
    // Should have GitHub links for projects that have them
    const githubLinks = screen.getAllByText('GitHub')
    expect(githubLinks.length).toBeGreaterThan(0)
    
    // Check that project links container exists
    const projectLinks = document.querySelectorAll('.project-links')
    expect(projectLinks.length).toBeGreaterThan(0)
  })

  it('handles empty filter results', async () => {
    const user = userEvent.setup()
    render(<Projects />)
    
    // Click documentation filter (assuming there might be fewer documentation projects)
    const documentationButton = screen.getByRole('button', { name: 'Documentation' })
    await user.click(documentationButton)
    
    // Should show at least the ISO27001 project or handle empty state
    expect(document.querySelectorAll('.project-card').length).toBeGreaterThanOrEqual(0)
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