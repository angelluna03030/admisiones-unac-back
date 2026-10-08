import { z } from 'zod';
import { EstadoSolicitud } from '../../../generated/prisma/client';

const estadoSolicitudEnum = z.nativeEnum(EstadoSolicitud);

export const querySolicitudSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  estado: estadoSolicitudEnum.optional(),
  programaId: z.string().uuid().optional(),
  aspiranteId: z.string().uuid().optional(),
});

export const createSolicitudSchema = z.object({
  aspiranteId: z.string().uuid('Aspirante inválido'),
  programaId: z.string().uuid('Programa inválido'),
  puntajeIcfes: z.number().int().min(0).max(500).optional().nullable(),
  valorPagoInscripcion: z.number().nonnegative().optional().nullable(),
});

export const updateSolicitudSchema = z.object({
  programaId: z.string().uuid('Programa inválido').optional(),
  puntajeIcfes: z.number().int().min(0).max(500).optional().nullable(),
  bachillerValidado: z.boolean().optional(),
  icfesValidado: z.boolean().optional(),
  requisitosValidados: z.boolean().optional(),
  valorPagoInscripcion: z.number().nonnegative().optional().nullable(),
  valorMatricula: z.number().nonnegative().optional().nullable(),
  fechaLimiteRespuesta: z.string().optional().nullable(),
  codigoEstudiante: z.string().min(3).optional().nullable(),
});

export const cambiarEstadoSchema = z.object({
  estado: estadoSolicitudEnum,
});

export type QuerySolicitudDto = z.infer<typeof querySolicitudSchema>;
export type CreateSolicitudDto = z.infer<typeof createSolicitudSchema>;
export type UpdateSolicitudDto = z.infer<typeof updateSolicitudSchema>;
export type CambiarEstadoDto = z.infer<typeof cambiarEstadoSchema>;
