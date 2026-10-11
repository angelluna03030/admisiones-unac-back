import { z } from 'zod';

export const tipoDecisionEnum = z.enum([
  'NOTIFICAR_ADMISION',
  'SOLICITAR_CORRECCION_PERFIL',
  'RECHAZAR',
]);
export const estadoRatificacionEnum = z.enum([
  'PENDIENTE',
  'RATIFICADA',
  'RECHAZADA',
]);

export const queryDecisionSchema = z.object({
  tipo: tipoDecisionEnum.optional(),
  estadoRatificacion: estadoRatificacionEnum.optional(),
  solicitudId: z.string().uuid().optional(),
});

export const createDecisionSchema = z.object({
  solicitudId: z.string().uuid('Selecciona una solicitud'),
  tipo: tipoDecisionEnum,
  justificacion: z.string().trim().optional().nullable(),
});

export const updateDecisionSchema = z.object({
  tipo: tipoDecisionEnum.optional(),
  justificacion: z.string().trim().optional().nullable(),
});

export const ratificarDecisionSchema = z
  .object({
    estadoRatificacion: z.enum(['RATIFICADA', 'RECHAZADA']),
    comentarioRatificacion: z.string().trim().optional().nullable(),
  })
  .refine(
    (d) => d.estadoRatificacion !== 'RECHAZADA' || !!d.comentarioRatificacion,
    {
      message: 'Indica por qué no se ratifica la decisión',
      path: ['comentarioRatificacion'],
    },
  );

export type QueryDecisionDto = z.infer<typeof queryDecisionSchema>;
export type CreateDecisionDto = z.infer<typeof createDecisionSchema>;
export type UpdateDecisionDto = z.infer<typeof updateDecisionSchema>;
export type RatificarDecisionDto = z.infer<typeof ratificarDecisionSchema>;
