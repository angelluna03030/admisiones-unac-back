import type { Request, Response } from 'express';
import { DecisionError, decisionService } from '../models/decision.service';
import {
  createDecisionSchema,
  queryDecisionSchema,
  ratificarDecisionSchema,
  updateDecisionSchema,
} from '../domain/decision/decision.schema';

const manejarError = (res: Response, error: any, contexto: string) => {
  if (error instanceof DecisionError) {
    return res
      .status(error.status)
      .json({ success: false, message: error.message });
  }
  if (error.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'La solicitud o el usuario seleccionado no existe',
    });
  }
  console.error(`Error al ${contexto}:`, error);
  res
    .status(500)
    .json({ success: false, message: 'Error interno del servidor' });
};

const datosInvalidos = (
  res: Response,
  error: { issues: { message: string }[] },
) =>
  res.status(400).json({
    success: false,
    message: error.issues[0]?.message ?? 'Datos inválidos',
  });

export const decisionController = {
  getAll: async (req: Request, res: Response) => {
    const validation = queryDecisionSchema.safeParse(req.query);
    if (!validation.success) return datosInvalidos(res, validation.error);

    try {
      const data = await decisionService.getAll(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      manejarError(res, error, 'obtener decisiones');
    }
  },

  create: async (req: Request, res: Response) => {
    const validation = createDecisionSchema.safeParse(req.body);
    if (!validation.success) return datosInvalidos(res, validation.error);

    try {
      const data = await decisionService.create(validation.data, req.user!.id);
      res.status(201).json({ success: true, data });
    } catch (error) {
      manejarError(res, error, 'crear decisión');
    }
  },

  update: async (req: Request, res: Response) => {
    const validation = updateDecisionSchema.safeParse(req.body);
    if (!validation.success) return datosInvalidos(res, validation.error);

    try {
      const data = await decisionService.update(
        req.params.id as string,
        validation.data,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      manejarError(res, error, 'actualizar decisión');
    }
  },

  ratificar: async (req: Request, res: Response) => {
    const validation = ratificarDecisionSchema.safeParse(req.body);
    if (!validation.success) return datosInvalidos(res, validation.error);

    try {
      const data = await decisionService.ratificar(
        req.params.id as string,
        validation.data,
        req.user!.id,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      manejarError(res, error, 'ratificar decisión');
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await decisionService.delete(req.params.id as string);
      res
        .status(200)
        .json({ success: true, message: 'Decisión eliminada correctamente' });
    } catch (error) {
      manejarError(res, error, 'eliminar decisión');
    }
  },
};
