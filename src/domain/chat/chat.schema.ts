import { z } from 'zod';

export const chatMessageSchema = z.object({
  sessionId: z
    .string()
    .min(8)
    .max(64)
    .regex(/^[a-zA-Z0-9-]+$/, 'Sesión inválida'),
  message: z.string().trim().min(1, 'Escribe un mensaje').max(1000),
});

export const preinscripcionChatSchema = z.object({
  nombres: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellidos: z
    .string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres'),
  tipoDocumento: z.string().trim().min(2).default('CC'),
  numeroDocumento: z
    .string()
    .trim()
    .min(5, 'El número de documento es requerido'),
  correo: z.string().trim().email('Correo electrónico inválido'),
  telefono: z.string().trim().min(7, 'El teléfono es requerido'),
  programaId: z.string().uuid('Programa inválido'),
});

export const whatsappChatSchema = z.object({
  telefono: z.string().trim().min(7, 'El teléfono es requerido'),
  mensaje: z.string().trim().min(1).max(4000),
});

export type ChatMessageDto = z.infer<typeof chatMessageSchema>;
export type PreinscripcionChatDto = z.infer<typeof preinscripcionChatSchema>;
export type WhatsappChatDto = z.infer<typeof whatsappChatSchema>;
