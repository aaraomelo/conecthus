import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { getErrorMessage } from '../api/client'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register(name, email, password)
      navigate('/tasks', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} data-testid="register-form">
        <h1 className="auth-card__title">Criar conta</h1>
        <p className="auth-card__subtitle">Comece a organizar suas tarefas</p>

        {error ? (
          <div className="alert alert--error" role="alert" data-testid="register-error">
            {error}
          </div>
        ) : null}

        <label className="field">
          <span>Nome</span>
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            data-testid="register-name"
          />
        </label>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            data-testid="register-email"
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            data-testid="register-password"
          />
        </label>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={submitting}
          data-testid="register-submit"
        >
          {submitting ? 'Criando conta…' : 'Criar conta'}
        </button>

        <p className="auth-card__footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  )
}