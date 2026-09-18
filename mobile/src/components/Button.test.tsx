import { fireEvent, render } from '@testing-library/react-native'
import { Button } from './Button'

describe('Button', () => {
  it('renders label and handles press', async () => {
    const onPress = jest.fn()
    const { getByRole } = await render(<Button label="Salvar" onPress={onPress} />)
    expect(getByRole('button')).toBeTruthy()
    fireEvent.press(getByRole('button'))
    expect(onPress).toHaveBeenCalled()
  })

  it('shows loading indicator and disables press', async () => {
    const onPress = jest.fn()
    const { getByRole } = await render(<Button label="Salvar" onPress={onPress} loading />)
    fireEvent.press(getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('disables when disabled', async () => {
    const onPress = jest.fn()
    const { getByRole } = await render(<Button label="Excluir" onPress={onPress} disabled />)
    fireEvent.press(getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })
})
