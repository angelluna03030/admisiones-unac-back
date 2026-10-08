import type { Request, Response } from 'express';
import { solicitudService } from '../models/solicitud.service';
import {
  cambiarEstadoSchema,
  createSolicitudSchema,
  querySolicitudSchema,
  updateSolicitudSchema,
} from '../domain/solicitud/solicitud.schema';

export const solicitudController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const validation = querySolicitudSchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      const result = await solicitudService.getAll(validation.data);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await solicitudService.getById(id as string);
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: 'Solicitud no encontrada' });
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener solicitud:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validationResult = createSolicitudSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const data = await solicitudService.create(validationResult.data);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'El aspirante o el programa seleccionado no existe',
        });
      }
      console.error('Error al crear solicitud:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validationResult = updateSolicitudSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const data = await solicitudService.update(
        id as string,
        validationResult.data,
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res
          .status(404)
          .json({ success: false, message: 'Solicitud no encontrada' });
      }
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'El código de estudiante ya está asignado a otra solicitud',
        });
      }
      if (error.code === 'P2003') {
        return res
          .status(400)
          .json({
            success: false,
            message: 'El programa seleccionado no existe',
          });
      }
      console.error('Error al actualizar solicitud:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  cambiarEstado: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validationResult = cambiarEstadoSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const data = await solicitudService.cambiarEstado(
        id as string,
        validationResult.data.estado,
      );
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: 'Solicitud no encontrada' });
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al cambiar estado de solicitud:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },
};
