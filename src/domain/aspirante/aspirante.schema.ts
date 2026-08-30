import { z } from 'zod';

export const createAspiranteSchema = z.object({
  nombres: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellidos: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  tipoDocumento: z.string().min(2, 'El tipo de documento es requerido'),
  numeroDocumento: z.string().min(5, 'El número de documento es requerido'),
  correo: z.string().email('Correo electrónico inválido'),
  telefono: z.string().optional().nullable(),
  fechaNacimiento: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
});

export const updateAspiranteSchema = createAspiranteSchema.partial();

export type CreateAspiranteDto = z.infer<typeof createAspiranteSchema>;
export type UpdateAspiranteDto = z.infer<typeof updateAspiranteSchema>;

// Esquema para la paginación y búsqueda (Query Params)
export const queryAspiranteSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export type QueryAspiranteDto = z.infer<typeof queryAspiranteSchema>;
