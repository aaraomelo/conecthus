import { render } from '@testing-library/react-native'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders TODO label', async () => {
    const { getByText } = await render(<StatusBadge status="TODO" />)
    expect(getByText('A fazer')).toBeTruthy()
  })

  it('renders IN_PROGRESS label', async () => {
    const { getByText } = await render(<StatusBadge status="IN_PROGRESS" />)
    expect(getByText('Em andamento')).toBeTruthy()
  })

  it('renders DONE label', async () => {
    const { getByText } = await render(<StatusBadge status="DONE" />)
    expect(getByText('Concluída')).toBeTruthy()
  })
})
