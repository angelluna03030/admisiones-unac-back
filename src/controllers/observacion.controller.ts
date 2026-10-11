import type { Request, Response } from 'express';
import { observacionService } from '../models/observacion.service';
import {
  createObservacionSchema,
  queryObservacionSchema,
  resolverObservacionSchema,
  updateObservacionSchema,
} from '../domain/observacion/observacion.schema';

const datosInvalidos = (
  res: Response,
  error: { issues: { message: string }[] },
) =>
  res.status(400).json({
    success: false,
    message: error.issues[0]?.message ?? 'Datos inválidos',
  });

const manejarError = (res: Response, error: any, contexto: string) => {
  if (error.code === 'P2025') {
    return res
      .status(404)
      .json({ success: false, message: 'Observación no encontrada' });
  }
  if (error.code === 'P2003') {
    return res
      .status(400)
      .json({ success: false, message: 'La solicitud no existe' });
  }
  console.error(`Error al ${contexto}:`, error);
  res
    .status(500)
    .json({ success: false, message: 'Error interno del servidor' });
};

export const observacionController = {
  getAll: async (req: Request, res: Response) => {
    const validation = queryObservacionSchema.safeParse(req.query);
    if (!validation.success) return datosInvalidos(res, validation.error);

    try {
      const data = await observacionService.getAll(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      manejarError(res, error, 'obtener observaciones');
    }
  },

  create: async (req: Request, res: Response) => {
    const validation = createObservacionSchema.safeParse(req.body);
    if (!validation.success) return datosInvalidos(res, validation.error);

    try {
      const { observacion, whatsapp } = await observacionService.create(
        validation.data,
        req.user!.id,
      );
      res.status(201).json({ success: true, data: observacion, whatsapp });
    } catch (error) {
      manejarError(res, error, 'crear observación');
    }
  },

  update: async (req: Request, res: Response) => {
    const validation = updateObservacionSchema.safeParse(req.body);
    if (!validation.success) return datosInvalidos(res, validation.error);

    try {
      const data = await observacionService.update(
        req.params.id as string,
        validation.data,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      manejarError(res, error, 'actualizar observación');
    }
  },

  resolver: async (req: Request, res: Response) => {
    const validation = resolverObservacionSchema.safeParse(req.body);
    if (!validation.success) return datosInvalidos(res, validation.error);

    try {
      const data = await observacionService.resolver(
        req.params.id as string,
        validation.data.resuelta,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      manejarError(res, error, 'resolver observación');
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await observacionService.delete(req.params.id as string);
      res.status(200).json({
        success: true,
        message: 'Observación eliminada correctamente',
      });
    } catch (error) {
      manejarError(res, error, 'eliminar observación');
    }
  },
};
