import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskListPage } from './TaskListPage'

vi.mock('../api/tasks', () => ({
  useTasks: () => ({ data: [], isLoading: false, error: null }),
  useCreateTask: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTask: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTask: () => ({ mutate: vi.fn(), isPending: false }),
}))

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient()
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('TaskListPage', () => {
  it('renders heading and empty state', () => {
    renderWithProviders(
      <TaskListPage search="" statusFilter="ALL" priorityFilter="ALL" view="board" />,
    )
    expect(screen.getByRole('heading', { level: 2, name: /your tasks/i })).toBeInTheDocument()
    expect(screen.getByText(/no tasks match your filters yet/i)).toBeInTheDocument()
  })
})
