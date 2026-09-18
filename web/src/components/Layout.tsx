import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { TASKS_CHANGED_EVENT, useNotifications } from '../mqtt/useNotifications'
import { NotificationToast } from './NotificationToast'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { notifications, dismiss, dismissAll } = useNotifications(user?.id, (note) => {
    window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT, { detail: note }))
  })

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() ?? ''

  return (
    <>
      <header className="topbar">
        <nav className="topbar__inner">
          <NavLink to="/tasks" className="topbar__brand">
            Conecthus
          </NavLink>

          <div className="topbar__links">
            <NavLink to="/tasks">Tarefas</NavLink>
            <NavLink to="/tasks/new" className="btn btn--primary btn--sm">
              Nova tarefa
            </NavLink>
          </div>

          {user ? (
            <div className="topbar__user">
              <span className="avatar" title={user.name}>
                {initials || '?'}
              </span>
              <span className="topbar__name">{user.name}</span>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={handleLogout}
                data-testid="logout-button"
              >
                Sair
              </button>
            </div>
          ) : null}
        </nav>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <NotificationToast
        notifications={notifications}
        onDismiss={dismiss}
        onDismissAll={dismissAll}
      />
    </>
  )
}