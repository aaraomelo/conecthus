import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskFilters } from './TaskFilters'
import type { TaskQuery } from '../types'

function Harness() {
  const [filters, setFilters] = useState<TaskQuery>({})
  return <TaskFilters filters={filters} onChange={setFilters} />
}

describe('TaskFilters', () => {
  it('calls onChange with the selected status', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<TaskFilters filters={{}} onChange={onChange} />)

    await user.selectOptions(screen.getByTestId('filter-status'), 'DONE')
    expect(onChange).toHaveBeenCalledWith({ status: 'DONE', page: 1 })
  })

  it('keeps the typed search term and reveals the clear button', async () => {
    const user = userEvent.setup()

    render(<Harness />)

    await user.type(screen.getByTestId('filter-search'), 'abc')
    expect(screen.getByTestId('filter-search')).toHaveValue('abc')
    expect(screen.getByTestId('filter-clear')).toBeInTheDocument()

    await user.click(screen.getByTestId('filter-clear'))
    expect(screen.getByTestId('filter-search')).toHaveValue('')
    expect(screen.queryByTestId('filter-clear')).not.toBeInTheDocument()
  })

  it('updates date filters', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<TaskFilters filters={{ status: 'TODO' }} onChange={onChange} />)

    await user.type(screen.getByTestId('filter-date-from'), '2026-01-10')
    expect(onChange).toHaveBeenLastCalledWith({
      status: 'TODO',
      dueDateFrom: '2026-01-10',
      page: 1,
    })
  })

  it('shows a clear button when filters are active and reset them', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <TaskFilters filters={{ status: 'TODO' }} onChange={onChange} />,
    )

    expect(screen.getByTestId('filter-clear')).toBeInTheDocument()
    await user.click(screen.getByTestId('filter-clear'))
    expect(onChange).toHaveBeenCalledWith({ page: 1 })

    rerender(<TaskFilters filters={{}} onChange={onChange} />)
    expect(screen.queryByTestId('filter-clear')).not.toBeInTheDocument()
  })
})