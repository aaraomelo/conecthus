import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120, 'Nome excessivo'),
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Senha excessiva'),
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export type RegisterValues = z.infer<typeof registerSchema>