import { z } from 'zod';
import { passwordSchema } from '../auth/auth.schema';

// Enum que coincide exactamente con tu schema.prisma
const rolUsuarioEnum = z.enum([
  'ADMISIONES',
  'CAPELLAN',
  'COORDINADOR_PROGRAMA',
  'VICERRECTORIA',
  'OFICINA_FINANCIERA',
  'REGISTRO_ACADEMICO',
  'ADMIN',
]);

export const createUsuarioSchema = z.object({
  nombres: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellidos: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  correo: z.email('Correo electrónico inválido'),
  rol: rolUsuarioEnum,
  activo: z.boolean().optional().default(true),
  // Opcional: sin contraseña el usuario existe pero no puede iniciar sesión
  password: passwordSchema.optional(),
});

export const updateUsuarioSchema = z.object({
  nombres: z.string().min(2).optional(),
  apellidos: z.string().min(2).optional(),
  correo: z.string().email().optional(),
  rol: rolUsuarioEnum.optional(),
  activo: z.boolean().optional(),
  password: passwordSchema.optional(),
});

export type CreateUsuarioDto = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioDto = z.infer<typeof updateUsuarioSchema>;
