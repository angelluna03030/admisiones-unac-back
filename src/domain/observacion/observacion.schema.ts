import { z } from 'zod';

export const queryObservacionSchema = z.object({
  resuelta: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  solicitudId: z.string().uuid().optional(),
});

export const createObservacionSchema = z.object({
  solicitudId: z.string().uuid('Selecciona una solicitud'),
  motivo: z
    .string()
    .trim()
    .min(3, 'Indica el motivo de la observación')
    .max(150),
  detalle: z.string().trim().max(2000).optional().nullable(),
  notificarWhatsapp: z.boolean().optional().default(false),
});

export const updateObservacionSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(3, 'Indica el motivo de la observación')
    .max(150)
    .optional(),
  detalle: z.string().trim().max(2000).optional().nullable(),
});

export const resolverObservacionSchema = z.object({
  resuelta: z.boolean(),
});

export type QueryObservacionDto = z.infer<typeof queryObservacionSchema>;
export type CreateObservacionDto = z.infer<typeof createObservacionSchema>;
export type UpdateObservacionDto = z.infer<typeof updateObservacionSchema>;
