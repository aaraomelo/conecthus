import { fireEvent, render } from '@testing-library/react-native'
import { TaskFilters } from './TaskFilters'

describe('TaskFilters', () => {
  it('renders search input with value', async () => {
    const { getByTestId } = await render(
      <TaskFilters search="relatório" onSearchChange={jest.fn()} status="" onStatusChange={jest.fn()} />,
    )
    expect(getByTestId('tasks-search').props.value).toBe('relatório')
  })

  it('calls onSearchChange when typing', async () => {
    const onSearchChange = jest.fn()
    const { getByTestId } = await render(<TaskFilters search="" onSearchChange={onSearchChange} status="" onStatusChange={jest.fn()} />)
    fireEvent.changeText(getByTestId('tasks-search'), 'api')
    expect(onSearchChange).toHaveBeenCalledWith('api')
  })

  it('renders status chips and calls onStatusChange', async () => {
    const onStatusChange = jest.fn()
    const { getByTestId } = await render(<TaskFilters search="" onSearchChange={jest.fn()} status="" onStatusChange={onStatusChange} />)
    fireEvent.press(getByTestId('filter-DONE'))
    expect(onStatusChange).toHaveBeenCalledWith('DONE')
    fireEvent.press(getByTestId('filter-all'))
    expect(onStatusChange).toHaveBeenCalledWith('')
  })
})
