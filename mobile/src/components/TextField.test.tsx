import { fireEvent, render } from '@testing-library/react-native'
import { TextField } from './TextField'

describe('TextField', () => {
  it('renders label and placeholder', async () => {
    const { getByText, getByPlaceholderText } = await render(
      <TextField label="E-mail" value="" onChangeText={jest.fn()} placeholder="seu@email.com" />,
    )
    expect(getByText('E-mail')).toBeTruthy()
    expect(getByPlaceholderText('seu@email.com')).toBeTruthy()
  })

  it('calls onChangeText', async () => {
    const onChangeText = jest.fn()
    const { getByDisplayValue } = await render(<TextField label="Nome" value="Ana" onChangeText={onChangeText} />)
    fireEvent.changeText(getByDisplayValue('Ana'), 'Ana Silva')
    expect(onChangeText).toHaveBeenCalledWith('Ana Silva')
  })

  it('renders hint when provided', async () => {
    const { getByText } = await render(<TextField label="Senha" value="" onChangeText={jest.fn()} hint="Mínimo 6 caracteres" />)
    expect(getByText('Mínimo 6 caracteres')).toBeTruthy()
  })
})
