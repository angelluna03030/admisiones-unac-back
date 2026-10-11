import { z } from 'zod';

export const loginSchema = z.object({
  correo: z.string().trim().toLowerCase().email('Correo electrónico inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe tener al menos una letra')
  .regex(/\d/, 'La contraseña debe tener al menos un número');

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Ingresa tu contraseña actual'),
  passwordNueva: passwordSchema,
});

export type LoginDto = z.infer<typeof loginSchema>;
export type CambiarPasswordDto = z.infer<typeof cambiarPasswordSchema>;
