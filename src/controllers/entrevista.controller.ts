import type { Request, Response } from 'express';
import { entrevistaService } from '../models/entrevista.service';
import {
  createEntrevistaSchema,
  evaluacionAcademicaSchema,
  evaluacionCapellaniaSchema,
  queryEntrevistaSchema,
  updateEntrevistaSchema,
} from '../domain/entrevista/entrevista.schema';

export const entrevistaController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const validation = queryEntrevistaSchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      const data = await entrevistaService.getAll(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener entrevistas:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await entrevistaService.getById(id as string);
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: 'Entrevista no encontrada' });
      res.status(200).json({ success: true, data });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validationResult = createEntrevistaSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const data = await entrevistaService.create(validationResult.data);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'La solicitud o el evaluador seleccionado no existe',
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validationResult = updateEntrevistaSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const data = await entrevistaService.update(
        id as string,
        validationResult.data,
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res
          .status(404)
          .json({ success: false, message: 'Entrevista no encontrada' });
      }
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await entrevistaService.delete(id as string);
      res
        .status(200)
        .json({ success: true, message: 'Entrevista eliminada correctamente' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res
          .status(404)
          .json({ success: false, message: 'Entrevista no encontrada' });
      }
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },
  evaluar: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const entrevista = await entrevistaService.getById(id as string);
      if (!entrevista)
        return res
          .status(404)
          .json({ success: false, message: 'Entrevista no encontrada' });
      if (entrevista.estado === 'CANCELADA') {
        return res.status(409).json({
          success: false,
          message: 'No se puede evaluar una entrevista cancelada',
        });
      }

      const schema =
        entrevista.tipo === 'CAPELLANIA'
          ? evaluacionCapellaniaSchema
          : evaluacionAcademicaSchema;
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos de evaluación inválidos',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const data = await entrevistaService.evaluar(
        id as string,
        entrevista.tipo,
        validationResult.data,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al registrar evaluación:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },
};
