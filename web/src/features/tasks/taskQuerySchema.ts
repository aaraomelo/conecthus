import { z } from 'zod'

export const taskStatusSchema = z.string().refine(
  (v): v is 'TODO' | 'IN_PROGRESS' | 'DONE' => ['TODO', 'IN_PROGRESS', 'DONE'].includes(v),
  'Status inválido',
)

export const taskPrioritySchema = z.string().refine(
  (v): v is 'low' | 'medium' | 'high' => ['low', 'medium', 'high'].includes(v),
  'Prioridade inválida',
)

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(200, 'Título excessivo'),
  description: z.string().max(2000, 'Descrição excessiva').optional().default(''),
  status: taskStatusSchema.default('TODO'),
  priority: taskPrioritySchema.default('medium'),
  dueDate: z.string().optional().default(''),
})

export type CreateTaskValues = z.infer<typeof taskFormSchema>

export const taskQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  sortBy: z.string().refine(
    (v): boolean => ['createdAt', 'updatedAt', 'title', 'status', 'priority'].includes(v),
    'Campo de ordenação inválido',
  ).optional(),
  search: z.string().max(255).optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

export type TaskQueryValues = z.infer<typeof taskQuerySchema>