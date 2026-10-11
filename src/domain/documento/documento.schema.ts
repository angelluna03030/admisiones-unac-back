import { z } from 'zod';

export const tipoDocumentoEnum = z.enum([
  'DOCUMENTO_IDENTIDAD',
  'FOTO',
  'CERTIFICADO_BACHILLER',
  'RESULTADO_ICFES',
  'OTRO',
]);
export const estadoDocumentoEnum = z.enum([
  'PENDIENTE',
  'CARGADO',
  'VALIDADO',
  'RECHAZADO',
]);

/** Documentos obligatorios del paso 3: con todos validados, los requisitos quedan validados. */
export const DOCUMENTOS_OBLIGATORIOS = [
  'DOCUMENTO_IDENTIDAD',
  'FOTO',
  'CERTIFICADO_BACHILLER',
  'RESULTADO_ICFES',
] as const;

const urlArchivo = z
  .string()
  .trim()
  .url('El enlace del archivo no es válido')
  .optional()
  .nullable()
  .or(z.literal('').transform(() => null));

export const queryDocumentoSchema = z.object({
  estado: estadoDocumentoEnum.optional(),
  tipo: tipoDocumentoEnum.optional(),
  solicitudId: z.string().uuid().optional(),
});

export const createDocumentoSchema = z.object({
  solicitudId: z.string().uuid('Solicitud inválida'),
  tipo: tipoDocumentoEnum,
  urlArchivo,
  observacion: z.string().trim().optional().nullable(),
});

export const updateDocumentoSchema = z.object({
  urlArchivo,
  observacion: z.string().trim().optional().nullable(),
});

export const cambiarEstadoDocumentoSchema = z
  .object({
    estado: estadoDocumentoEnum,
    observacion: z.string().trim().optional().nullable(),
  })
  .refine((d) => d.estado !== 'RECHAZADO' || !!d.observacion, {
    message: 'Indica el motivo del rechazo',
    path: ['observacion'],
  });

export type QueryDocumentoDto = z.infer<typeof queryDocumentoSchema>;
export type CreateDocumentoDto = z.infer<typeof createDocumentoSchema>;
export type UpdateDocumentoDto = z.infer<typeof updateDocumentoSchema>;
export type CambiarEstadoDocumentoDto = z.infer<
  typeof cambiarEstadoDocumentoSchema
>;
