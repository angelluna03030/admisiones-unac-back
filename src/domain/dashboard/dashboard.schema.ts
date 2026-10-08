import { z } from 'zod';
import { EstadoSolicitud, RolUsuario } from '../../../generated/prisma/client';

// Esquema base para filtros de dashboard
export const dashboardFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  programaId: z.string().uuid().optional(),
  facultad: z.string().optional(),
  jornada: z.string().optional(),
  ciudad: z.string().optional(),
  estado: z.nativeEnum(EstadoSolicitud).optional(),
  rol: z.nativeEnum(RolUsuario).optional(), // Para ajustar datos según quien consulta
});

export const kpiQuerySchema = dashboardFilterSchema;

export const funnelQuerySchema = dashboardFilterSchema;

export const alertsQuerySchema = z.object({
  rol: z.nativeEnum(RolUsuario).optional(),
  programaId: z.string().uuid().optional(),
});

export const trendsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('month'),
  programaId: z.string().uuid().optional(),
});

export const activityQuerySchema = dashboardFilterSchema.extend({
  limit: z.coerce.number().int().positive().max(20).default(5),
});

export type DashboardFilterDto = z.infer<typeof dashboardFilterSchema>;
export type TrendsQueryDto = z.infer<typeof trendsQuerySchema>;
export type ActivityQueryDto = z.infer<typeof activityQuerySchema>;
