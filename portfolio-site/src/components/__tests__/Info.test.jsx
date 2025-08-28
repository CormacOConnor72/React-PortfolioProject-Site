import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Info from '../Info'

describe('Info Component', () => {
  it('renders without crashing', () => {
    render(<Info />)
    expect(screen.getByText('Personal Information')).toBeInTheDocument()
  })

  it('displays all information sections', () => {
    render(<Info />)
    
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Interests')).toBeInTheDocument()
    expect(screen.getByText('Contact Details')).toBeInTheDocument()
    expect(screen.getByText('Achievements')).toBeInTheDocument()
  })

  it('displays personal information with correct name', () => {
    render(<Info />)
    
    expect(screen.getByText(/Cormac O'Connor/)).toBeInTheDocument()
    expect(screen.getByText(/22 \(template\)/)).toBeInTheDocument()
  })

  it('shows template indicators', () => {
    render(<Info />)
    
    // Check that template indicators are present
    const templateTexts = screen.getAllByText(/\(template\)/)
    expect(templateTexts.length).toBeGreaterThan(0)
  })

  it('displays the note about template information', () => {
    render(<Info />)
    
    expect(screen.getByText(/Note: This information page is for demonstration purposes/)).toBeInTheDocument()
  })

  it('has proper section structure', () => {
    render(<Info />)
    
    const section = document.querySelector('.info-section')
    expect(section).toBeInTheDocument()
    
    const infoGrid = document.querySelector('.info-grid')
    expect(infoGrid).toBeInTheDocument()
    
    const infoCards = document.querySelectorAll('.info-card')
    expect(infoCards.length).toBe(6)
  })

  it('renders emoji icons for each section', () => {
    render(<Info />)
    
    const icons = document.querySelectorAll('.info-icon')
    expect(icons.length).toBe(6)
    
    // Check that icons contain emojis
    expect(icons[0]).toHaveTextContent('👨‍💻')
    expect(icons[1]).toHaveTextContent('🎓')
    expect(icons[2]).toHaveTextContent('💼')
    expect(icons[3]).toHaveTextContent('🌟')
    expect(icons[4]).toHaveTextContent('📞')
    expect(icons[5]).toHaveTextContent('🏆')
  })

  it('has proper responsive structure', () => {
    render(<Info />)
    
    const container = document.querySelector('.container')
    expect(container).toBeInTheDocument()
    
    const infoContent = document.querySelector('.info-content')
    expect(infoContent).toBeInTheDocument()
  })
})