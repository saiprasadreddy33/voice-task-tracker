import { FormEvent, useMemo, useState } from 'react'
import {
  useCreateTask,
  useTasks,
  useUpdateTask,
  type TaskStatus,
  type Task,
  type TaskPriority,
} from '../api/tasks'

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

function priorityBadgeClasses(priority: TaskPriority): string {
  switch (priority) {
    case 'LOW':
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    case 'HIGH':
      return 'bg-amber-50 text-amber-800 ring-amber-200'
    case 'CRITICAL':
      return 'bg-rose-50 text-rose-800 ring-rose-200'
    default:
      return 'bg-slate-100 text-slate-800 ring-slate-200'
  }
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false
  return new Date(task.dueDate) < new Date() && task.status !== 'DONE'
}

export function TaskListPage({
  search,
  statusFilter,
  priorityFilter,
  view,
}: {
  search: string
  statusFilter: 'ALL' | TaskStatus
  priorityFilter: 'ALL' | TaskPriority
  view: 'board' | 'list'
}) {
  const { data: tasks, isLoading, error } = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [viewState, setView] = useState<'list' | 'board'>('board')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    createTask.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
    })
    setTitle('')
    setDescription('')
  }

  const filteredTasks = useMemo(() => {
    let list = tasks ?? []

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q),
      )
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((t) => t.status === statusFilter)
    }

    if (priorityFilter !== 'ALL') {
      list = list.filter((t) => t.priority === priorityFilter)
    }

    return list
  }, [tasks, search, statusFilter, priorityFilter])

  const grouped: Record<TaskStatus, Task[]> = {
    PENDING: filteredTasks.filter((t) => t.status === 'PENDING'),
    IN_PROGRESS: filteredTasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: filteredTasks.filter((t) => t.status === 'DONE'),
  }

  return (
    <div className="space-y-4 text-slate-900">
      {/* Summary bar (search & view controls provided by App shell) */}
      <section className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div>
          <p className="text-sm text-slate-500">Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}</p>
        </div>
        <div className="text-sm text-slate-500">View controlled from header</div>
      </section>

      {/* Add Task form */}
      <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Title
            </label>
            <input
              placeholder="e.g. Follow up with design team about review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Description
            </label>
            <textarea
              placeholder="Optional details, context, or links"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
            />
          </div>
          <button
            type="submit"
            disabled={createTask.isPending}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 via-emerald-400 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(59,130,246,0.5)] transition hover:-translate-y-0.5 hover:from-sky-400 hover:via-emerald-300 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createTask.isPending ? 'Adding…' : 'Add task'}
          </button>
        </form>
        <p className="mt-2 text-[11px] text-slate-500">
          Hint: Start titles with a verb, like "Email PM about priorities".
        </p>
      </section>

      {isLoading && <p className="text-sm text-slate-500">Loading tasks…</p>}
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Failed to load tasks: {(error as Error).message}
        </p>
      )}
      {!isLoading && !error && (!tasks || tasks.length === 0) && (
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600">
            ?
          </span>
          No tasks yet. Add your first one above.
        </p>
      )}

      {filteredTasks.length > 0 && (
        <section className="space-y-4">
          {viewState === 'board' ? (
            <div className="grid gap-4 md:grid-cols-3">
              {(Object.keys(grouped) as TaskStatus[]).map((status) => {
                const columnTasks = grouped[status]
                return (
                  <div
                    key={status}
                    className="flex min-h-[220px] flex-col rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-sm shadow-slate-200/80"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" />
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {STATUS_LABELS[status]}
                        </h3>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {columnTasks.length} task{columnTasks.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                      {columnTasks.map((task) => (
                        <article
                          key={task.id}
                          className="group rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm shadow-slate-200/80 transition hover:-translate-y-0.5 hover:border-sky-400/70 hover:shadow-md hover:shadow-sky-200/80"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">
                              {task.title}
                            </h4>
                          </div>
                          {task.description && (
                            <p className="mb-2 line-clamp-3 text-xs text-slate-500">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${priorityBadgeClasses(
                                task.priority,
                              )}`}
                            >
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                            <div className="flex flex-col items-end gap-1">
                              {task.dueDate && (
                                <span
                                  className={
                                    'inline-flex items-center gap-1 text-[11px] ' +
                                    (isOverdue(task)
                                      ? 'text-rose-500'
                                      : 'text-slate-400 group-hover:text-slate-600')
                                  }
                                >
                                  {isOverdue(task) && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                  )}
                                  Due {new Date(task.dueDate).toLocaleString()}
                                </span>
                              )}
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  updateTask.mutate({
                                    id: task.id,
                                    data: { status: e.target.value as TaskStatus },
                                  })
                                }
                                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 outline-none ring-0 transition hover:border-sky-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-500/60"
                              >
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
              <div className="hidden bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.8fr)] sm:gap-3">
                <span>Title</span>
                <span>Priority</span>
                <span>Status</span>
                <span>Due</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid gap-3 px-4 py-3 text-sm text-slate-900 hover:bg-slate-50 sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.8fr)]"
                  >
                    <div>
                      <p className="font-semibold">{task.title}</p>
                      {task.description && (
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${priorityBadgeClasses(
                          task.priority,
                        )}`}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateTask.mutate({
                            id: task.id,
                            data: { status: e.target.value as TaskStatus },
                          })
                        }
                        className="w-full rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 outline-none ring-0 transition hover:border-sky-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-500/60"
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center text-xs text-slate-500">
                      {task.dueDate ? (
                        <span className={isOverdue(task) ? 'text-rose-500' : ''}>
                          {isOverdue(task) && 'Overdue · '}
                          {new Date(task.dueDate).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">No due date</span>
                      )}
                    </div>
                    <div className="flex items-center justify-end text-xs text-slate-400">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">Manual</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
