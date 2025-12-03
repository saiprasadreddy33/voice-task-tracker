import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecordTaskPage } from './RecordTaskPage'

const parseMock = vi.fn()

vi.mock('../api/voice', () => ({
  useParseVoiceNote: () => ({ mutateAsync: parseMock, isPending: false, error: null }),
}))

vi.mock('../api/tasks', () => ({
  useCreateTask: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('RecordTaskPage', () => {
  it('submits transcript for parsing', async () => {
    parseMock.mockResolvedValueOnce({
      rawTranscript: 'Test transcript',
      title: 'Test title',
      description: 'Test description',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: null,
    })

    render(
      <MemoryRouter>
        <RecordTaskPage />
      </MemoryRouter>,
    )

    const textarea = screen.getByPlaceholderText(/type or paste your spoken task/i)
    fireEvent.change(textarea, { target: { value: 'Test transcript' } })

    const button = screen.getByRole('button', { name: /parse and review/i })
    fireEvent.click(button)

    expect(parseMock).toHaveBeenCalled()
  })
})
