import { z } from 'zod';

export const tipoEntrevistaEnum = z.enum(['CAPELLANIA', 'ACADEMICA']);
export const estadoEntrevistaEnum = z.enum([
  'PENDIENTE',
  'REPROGRAMADA',
  'COMPLETADA',
  'CANCELADA',
]);

export const createEntrevistaSchema = z.object({
  solicitudId: z.string().uuid('ID de solicitud inválido'),
  tipo: tipoEntrevistaEnum,
  evaluadorId: z
    .string()
    .uuid('ID de evaluador inválido')
    .optional()
    .nullable(),
  fechaProgramada: z.string().min(1, 'La fecha programada es requerida'),
  modalidad: z
    .string()
    .min(2, 'La modalidad es requerida (ej. Presencial, Virtual)')
    .optional()
    .nullable(),
  lugarOEnlace: z
    .string()
    .min(2, 'El lugar o enlace es requerido')
    .optional()
    .nullable(),
});

export const updateEntrevistaSchema = createEntrevistaSchema.partial().extend({
  estado: estadoEntrevistaEnum.optional(),
  fechaRealizada: z
    .string()
    .min(1, 'Fecha realizada inválida')
    .optional()
    .nullable(),
  motivoReprogramacion: z.string().optional().nullable(),
});

export type CreateEntrevistaDto = z.infer<typeof createEntrevistaSchema>;
export type UpdateEntrevistaDto = z.infer<typeof updateEntrevistaSchema>;
