import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GlobalMetrics from '../GlobalMetrics'
import dataService from '../../services/dataService'

// Mock the dataService
vi.mock('../../services/dataService', () => ({
  default: {
    getGlobalMetrics: vi.fn()
  }
}))

const mockMetrics = {
  totalSpins: 1234,
  uniqueUsers: 89,
  todaySpins: 23,
  weekSpins: 145,
  topEntries: [
    { name: 'Coffee or Tea', count: 89 },
    { name: 'Pizza or Burger', count: 67 },
    { name: 'Netflix or YouTube', count: 45 }
  ]
}

describe('GlobalMetrics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Compact variant', () => {
    it('renders compact metrics layout by default', async () => {
      dataService.getGlobalMetrics.mockResolvedValue(mockMetrics)

      render(<GlobalMetrics />)

      expect(screen.getByText('🌍 Global Activity')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('1234')).toBeInTheDocument()
        expect(screen.getByText('89')).toBeInTheDocument()
        expect(screen.getByText('23')).toBeInTheDocument()
      })

      expect(screen.getByText('Total Spins')).toBeInTheDocument()
      expect(screen.getByText('Active Users')).toBeInTheDocument()
      expect(screen.getByText('Today')).toBeInTheDocument()
    })

    it('shows most popular entry in compact mode', async () => {
      dataService.getGlobalMetrics.mockResolvedValue(mockMetrics)

      render(<GlobalMetrics />)

      await waitFor(() => {
        expect(screen.getByText('🏆 Most Popular:')).toBeInTheDocument()
        expect(screen.getByText('Coffee or Tea (89)')).toBeInTheDocument()
      })
    })

    it('shows loading state in compact mode', async () => {
      let resolvePromise
      dataService.getGlobalMetrics.mockImplementation(() => new Promise((resolve) => {
        resolvePromise = resolve
      }))

      render(<GlobalMetrics />)

      expect(screen.getByText('⏳')).toBeInTheDocument()
      expect(screen.getAllByText('...')).toHaveLength(3)

      // Clean up by resolving the promise
      resolvePromise(mockMetrics)
      await waitFor(() => {
        expect(screen.getByText('1234')).toBeInTheDocument()
      })
    })
  })

  describe('Full variant', () => {
    it('renders full metrics layout', async () => {
      dataService.getGlobalMetrics.mockResolvedValue(mockMetrics)

      render(<GlobalMetrics variant="full" />)

      expect(screen.getByText('🌍 Global Decision Metrics')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '🔄 Refresh' })).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('1234')).toBeInTheDocument()
        expect(screen.getByText('89')).toBeInTheDocument()
        expect(screen.getByText('23')).toBeInTheDocument()
        expect(screen.getByText('145')).toBeInTheDocument()
      })

      expect(screen.getByText('Total Spins')).toBeInTheDocument()
      expect(screen.getByText('Active Users')).toBeInTheDocument()
      expect(screen.getByText('Spins Today')).toBeInTheDocument()
      expect(screen.getByText('This Week')).toBeInTheDocument()
    })

    it('shows top entries list in full mode', async () => {
      dataService.getGlobalMetrics.mockResolvedValue(mockMetrics)

      render(<GlobalMetrics variant="full" />)

      await waitFor(() => {
        expect(screen.getByText('🏆 Most Popular Decisions')).toBeInTheDocument()
        expect(screen.getByText('#1')).toBeInTheDocument()
        expect(screen.getByText('#2')).toBeInTheDocument()
        expect(screen.getByText('#3')).toBeInTheDocument()
        expect(screen.getByText('Coffee or Tea')).toBeInTheDocument()
        expect(screen.getByText('89 spins')).toBeInTheDocument()
      })
    })

    it('allows refreshing metrics', async () => {
      dataService.getGlobalMetrics.mockResolvedValue(mockMetrics)
      const user = userEvent.setup()

      render(<GlobalMetrics variant="full" />)

      await waitFor(() => {
        expect(screen.getByText('1234')).toBeInTheDocument()
      })

      const refreshButton = screen.getByRole('button', { name: '🔄 Refresh' })
      await user.click(refreshButton)

      expect(dataService.getGlobalMetrics).toHaveBeenCalledTimes(2)
    })

    it('disables refresh button during loading', async () => {
      let resolvePromise
      dataService.getGlobalMetrics.mockImplementation(() => new Promise((resolve) => {
        resolvePromise = resolve
      }))

      render(<GlobalMetrics variant="full" />)

      const refreshButton = screen.getByRole('button', { name: '🔄 Refresh' })
      expect(refreshButton).toBeDisabled()

      // Clean up by resolving the promise
      resolvePromise(mockMetrics)
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled()
      })
    })
  })

  describe('Error handling', () => {
    it('fails silently on error and renders nothing', async () => {
      dataService.getGlobalMetrics.mockRejectedValue(new Error('API Error'))

      const { container } = render(<GlobalMetrics />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })

    it('fails silently when no metrics returned', async () => {
      dataService.getGlobalMetrics.mockResolvedValue(null)

      const { container } = render(<GlobalMetrics />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })
  })

  describe('Loading states', () => {
    it('shows loading indicators', async () => {
      let resolvePromise
      dataService.getGlobalMetrics.mockImplementation(() => new Promise((resolve) => {
        resolvePromise = resolve
      }))

      render(<GlobalMetrics />)

      expect(screen.getByText('⏳')).toBeInTheDocument()
      expect(screen.getAllByText('...')).toHaveLength(3)

      // Clean up by resolving the promise
      resolvePromise(mockMetrics)
      await waitFor(() => {
        expect(screen.getByText('1234')).toBeInTheDocument()
      })
    })

    it('shows loading indicators in full mode', async () => {
      let resolvePromise
      dataService.getGlobalMetrics.mockImplementation(() => new Promise((resolve) => {
        resolvePromise = resolve
      }))

      render(<GlobalMetrics variant="full" />)

      expect(screen.getAllByText('...')).toHaveLength(4)

      // Clean up by resolving the promise
      resolvePromise(mockMetrics)
      await waitFor(() => {
        expect(screen.getByText('1234')).toBeInTheDocument()
      })
    })
  })

  describe('Edge cases', () => {
    it('handles metrics without top entries', async () => {
      const metricsWithoutTopEntries = {
        ...mockMetrics,
        topEntries: []
      }
      dataService.getGlobalMetrics.mockResolvedValue(metricsWithoutTopEntries)

      render(<GlobalMetrics />)

      await waitFor(() => {
        expect(screen.getByText('1234')).toBeInTheDocument()
      })

      expect(screen.queryByText('🏆 Most Popular:')).not.toBeInTheDocument()
    })

    it('handles missing metric values gracefully', async () => {
      const incompleteMetrics = {
        totalSpins: undefined,
        uniqueUsers: null,
        todaySpins: 0
      }
      dataService.getGlobalMetrics.mockResolvedValue(incompleteMetrics)

      render(<GlobalMetrics />)

      await waitFor(() => {
        expect(screen.getByText('Total Spins')).toBeInTheDocument()
      })

      // Should show 0 for missing values
      const metricValues = screen.getAllByText('0')
      expect(metricValues.length).toBe(3) // All three metrics should show 0
    })
  })
})