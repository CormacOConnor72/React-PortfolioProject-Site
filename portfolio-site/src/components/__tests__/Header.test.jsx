import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Header from '../Header'

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the logo', () => {
    renderWithRouter(<Header />)
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    renderWithRouter(<Header />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('toggles mobile menu when hamburger is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)
    
    const hamburger = screen.getByLabelText(/toggle menu/i)
    const nav = document.querySelector('.nav')
    
    // Menu should be closed initially
    expect(nav).not.toHaveClass('nav-open')
    
    // Click hamburger to open menu
    await user.click(hamburger)
    expect(nav).toHaveClass('nav-open')
    
    // Click again to close menu
    await user.click(hamburger)
    expect(nav).not.toHaveClass('nav-open')
  })

  it('adds scrolled class when page is scrolled', async () => {
    renderWithRouter(<Header />)
    const header = document.querySelector('.header')
    
    // Initially not scrolled
    expect(header).not.toHaveClass('scrolled')
    
    // Simulate scroll
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 100
    })
    
    fireEvent.scroll(window)
    
    await waitFor(() => {
      expect(header).toHaveClass('scrolled')
    })
  })

  it('closes mobile menu when navigation link is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)
    
    const hamburger = screen.getByLabelText(/toggle menu/i)
    const nav = document.querySelector('.nav')
    
    // Open menu
    await user.click(hamburger)
    expect(nav).toHaveClass('nav-open')
    
    // Click a navigation link
    const aboutLink = screen.getByText('About')
    await user.click(aboutLink)
    
    // Menu should close
    expect(nav).not.toHaveClass('nav-open')
  })

  it('calls scrollIntoView when navigation link is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)
    
    // Create a mock element and add it to DOM
    const mockElement = document.createElement('div')
    mockElement.id = 'about'
    document.body.appendChild(mockElement)
    
    const aboutLink = screen.getByText('About')
    await user.click(aboutLink)
    
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    
    // Cleanup
    document.body.removeChild(mockElement)
  })
})