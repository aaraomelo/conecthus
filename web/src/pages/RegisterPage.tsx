import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { getErrorMessage } from '../api/client'
import { registerSchema, type RegisterValues } from '../features/auth/registerSchema'

interface RegisterFormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  })

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser(data.name, data.email, data.password)
      navigate('/tasks', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit(onSubmit)} data-testid="register-form">
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
            autoComplete="name"
            {...register('name')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            data-testid="register-name"
          />
          {errors.name ? (
            <span id="register-name-error" className="field__error" role="alert">
              {errors.name.message}
            </span>
          ) : null}
        </label>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            data-testid="register-email"
          />
          {errors.email ? (
            <span id="register-email-error" className="field__error" role="alert">
              {errors.email.message}
            </span>
          ) : null}
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            autoComplete="new-password"
            {...register('password')}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
            data-testid="register-password"
          />
          {errors.password ? (
            <span id="register-password-error" className="field__error" role="alert">
              {errors.password.message}
            </span>
          ) : null}
        </label>

        <label className="field">
          <span>Confirmar senha</span>
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined}
            data-testid="register-confirm-password"
          />
          {errors.confirmPassword ? (
            <span id="register-confirm-error" className="field__error" role="alert">
              {errors.confirmPassword.message}
            </span>
          ) : null}
        </label>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={isSubmitting}
          data-testid="register-submit"
        >
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </button>

        <p className="auth-card__footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  )
}