import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Contact from '../Contact'

describe('Contact Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders contact form with all fields', () => {
    render(<Contact />)
    
    expect(screen.getByText("Let's Work Together")).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('renders contact methods', () => {
    render(<Contact />)
    
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
  })

  it('updates form fields when user types', async () => {
    const user = userEvent.setup()
    render(<Contact />)
    
    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const messageInput = screen.getByLabelText(/message/i)
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(messageInput, 'Test message')
    
    expect(nameInput.value).toBe('John Doe')
    expect(emailInput.value).toBe('john@example.com')
    expect(messageInput.value).toBe('Test message')
  })

  it('validates required fields on submit', async () => {
    const user = userEvent.setup()
    render(<Contact />)
    
    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)
    
    // Form should not submit with empty fields
    expect(screen.getByLabelText(/name/i)).toBeInvalid()
    expect(screen.getByLabelText(/email/i)).toBeInvalid()
    expect(screen.getByLabelText(/message/i)).toBeInvalid()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<Contact />)
    
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)
    
    expect(emailInput).toBeInvalid()
  })

  it('shows loading state when form is submitted', async () => {
    const user = userEvent.setup()
    render(<Contact />)
    
    // Fill out valid form
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/message/i), 'Test message')
    
    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/sending/i)).toBeInTheDocument()
  })

  it('shows success message after form submission', async () => {
    const user = userEvent.setup()
    render(<Contact />)
    
    // Fill out valid form
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/message/i), 'Test message')
    
    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('clears form after successful submission', async () => {
    const user = userEvent.setup()
    render(<Contact />)
    
    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const messageInput = screen.getByLabelText(/message/i)
    
    // Fill out form
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(messageInput, 'Test message')
    
    const submitButton = screen.getByRole('button', { name: /send message/i })
    await user.click(submitButton)
    
    // Wait for form to clear
    await waitFor(() => {
      expect(nameInput.value).toBe('')
      expect(emailInput.value).toBe('')
      expect(messageInput.value).toBe('')
    }, { timeout: 3000 })
  })

  it('renders contact method links with correct hrefs', () => {
    render(<Contact />)
    
    const emailLink = screen.getByText('cormacoconnor72@outlook.ie').closest('a')
    const linkedinLink = screen.getByText('linkedin.com/in/cormac-o-connor-705646261/').closest('a')
    const githubLink = screen.getByText('github.com/CormacOConnor72').closest('a')
    
    expect(emailLink).toHaveAttribute('href', 'mailto:cormacoconnor72@outlook.ie')
    expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/cormac-o-connor-705646261/')
    expect(githubLink).toHaveAttribute('href', 'https://github.com/CormacOConnor72')
  })
})