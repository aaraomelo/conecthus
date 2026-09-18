import type { TaskQuery, TaskStatus } from '../types'

interface Props {
  filters: TaskQuery
  onChange: (next: TaskQuery) => void
}

const STATUS_OPTIONS: Array<{ value: '' | TaskStatus; label: string }> = [
  { value: '', label: 'Todos os status' },
  { value: 'TODO', label: 'A fazer' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'DONE', label: 'Concluída' },
]

export function TaskFilters({ filters, onChange }: Props) {
  const patch = (partial: Partial<TaskQuery>) => onChange({ ...filters, ...partial, page: 1 })

  const hasFilters = Boolean(
    filters.status || filters.search || filters.dueDateFrom || filters.dueDateTo,
  )

  return (
    <form
      className="filters"
      onSubmit={(event) => event.preventDefault()}
      data-testid="task-filters"
    >
      <label className="field">
        <span>Status</span>
        <select
          value={filters.status ?? ''}
          onChange={(event) =>
            patch({ status: event.target.value as TaskStatus | '' })
          }
          data-testid="filter-status"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Buscar</span>
        <input
          type="search"
          placeholder="Título ou descrição"
          value={filters.search ?? ''}
          onChange={(event) => patch({ search: event.target.value })}
          data-testid="filter-search"
        />
      </label>

      <label className="field">
        <span>Vence de</span>
        <input
          type="date"
          value={filters.dueDateFrom ?? ''}
          onChange={(event) => patch({ dueDateFrom: event.target.value })}
          data-testid="filter-date-from"
        />
      </label>

      <label className="field">
        <span>Vence até</span>
        <input
          type="date"
          value={filters.dueDateTo ?? ''}
          onChange={(event) => patch({ dueDateTo: event.target.value })}
          data-testid="filter-date-to"
        />
      </label>

      {hasFilters ? (
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => onChange({ page: 1 })}
          data-testid="filter-clear"
        >
          Limpar filtros
        </button>
      ) : null}
    </form>
  )
}