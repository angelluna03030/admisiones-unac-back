import type { Request, Response } from 'express';
import { dashboardService } from '../models/dashboard.service';
import {
  kpiQuerySchema,
  funnelQuerySchema,
  alertsQuerySchema,
  trendsQuerySchema,
  activityQuerySchema,
} from '../domain/dashboard/dashboard.schema';

export const dashboardController = {
  getKPIs: async (req: Request, res: Response) => {
    try {
      const validation = kpiQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      const data = await dashboardService.getKPIs(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener KPIs del dashboard:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  getFunnel: async (req: Request, res: Response) => {
    try {
      const validation = funnelQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      const data = await dashboardService.getFunnel(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener funnel del dashboard:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  getConversion: async (req: Request, res: Response) => {
    try {
      const validation = funnelQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      const data = await dashboardService.getConversion(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener conversión del dashboard:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  getProgramas: async (req: Request, res: Response) => {
    try {
      const validation = kpiQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      const data = await dashboardService.getProgramMetrics(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener métricas por programa:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  getActivity: async (req: Request, res: Response) => {
    try {
      const validation = activityQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      const data = await dashboardService.getActivity(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener actividad del dashboard:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  getAlerts: async (req: Request, res: Response) => {
    try {
      // Extraemos el rol del usuario autenticado (asumiendo que tu auth.middleware lo adjunta a req.user)
      const rol = (req as any).user?.rol || req.query.rol;
      const programaId = (req as any).user?.programaId || req.query.programaId;

      const validation = alertsQuerySchema.safeParse({ rol, programaId });
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      const data = await dashboardService.getAlerts(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener alertas del dashboard:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  getTrends: async (req: Request, res: Response) => {
    try {
      const validation = trendsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      const data = await dashboardService.getTrends(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener tendencias del dashboard:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  /**
   * Endpoint preparado para exportación a Excel/PDF
   * Devuelve los datos en formato plano (CSV-like) listo para que el frontend
   * use librerías como 'xlsx' o 'jspdf', o para que el backend genere el stream.
   */
  getExportData: async (req: Request, res: Response) => {
    try {
      const validation = kpiQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      // Obtenemos métricas por programa para la exportación
      const data = await dashboardService.getProgramMetrics(validation.data);

      // Aquí podrías integrar 'exceljs' o 'pdfmake' para devolver un buffer/archivo
      // Por ahora, devolvemos JSON estructurado para exportación frontend
      res.status(200).json({
        success: true,
        data,
        message:
          'Datos listos para exportación. Usa librería frontend (ej. xlsx) o implementa generación de stream en backend.',
      });
    } catch (error) {
      console.error('Error al preparar datos de exportación:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },
};
