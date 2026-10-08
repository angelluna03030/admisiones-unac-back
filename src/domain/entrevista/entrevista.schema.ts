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

export const queryEntrevistaSchema = z.object({
  estado: estadoEntrevistaEnum.optional(),
  tipo: tipoEntrevistaEnum.optional(),
  solicitudId: z.string().uuid().optional(),
  evaluadorId: z.string().uuid().optional(),
});

// Cada criterio de las rúbricas se puntúa de 1 a 5
const criterio = z.number().int().min(1, 'Mínimo 1').max(5, 'Máximo 5');

export const evaluacionCapellaniaSchema = z.object({
  valoresPrincipiosEticos: criterio,
  proyectoDeVida: criterio,
  convivenciaComunitaria: criterio,
  compromisoReglamento: criterio,
  actitudDisposicion: criterio,
  observaciones: z.string().optional().nullable(),
});

export const evaluacionAcademicaSchema = z.object({
  aptitudAcademica: criterio,
  perfilParaElPrograma: criterio,
  habilidadesComunicacion: criterio,
  pensamientoCritico: criterio,
  motivacionIntrinseca: criterio,
  conceptoAcademico: z.string().optional().nullable(),
  recomendacionFinal: z.string().optional().nullable(),
});

export type QueryEntrevistaDto = z.infer<typeof queryEntrevistaSchema>;
export type EvaluacionCapellaniaDto = z.infer<
  typeof evaluacionCapellaniaSchema
>;
export type EvaluacionAcademicaDto = z.infer<typeof evaluacionAcademicaSchema>;
