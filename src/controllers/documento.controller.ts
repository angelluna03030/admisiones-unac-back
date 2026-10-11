import type { Request, Response } from 'express';
import { documentoService } from '../models/documento.service';
import {
  cambiarEstadoDocumentoSchema,
  createDocumentoSchema,
  queryDocumentoSchema,
  updateDocumentoSchema,
} from '../domain/documento/documento.schema';

export const documentoController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const validation = queryDocumentoSchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, errors: validation.error.issues });
      }

      const data = await documentoService.getAll(validation.data);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validation = createDocumentoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: validation.error.issues[0]?.message ?? 'Datos inválidos',
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const data = await documentoService.create(validation.data);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Esa solicitud ya tiene un documento de este tipo',
        });
      }
      if (error.code === 'P2003') {
        return res
          .status(400)
          .json({ success: false, message: 'La solicitud no existe' });
      }
      console.error('Error al crear documento:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const validation = updateDocumentoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: validation.error.issues[0]?.message ?? 'Datos inválidos',
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const data = await documentoService.update(
        req.params.id as string,
        validation.data,
      );
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: 'Documento no encontrado' });
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al actualizar documento:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  cambiarEstado: async (req: Request, res: Response) => {
    try {
      const validation = cambiarEstadoDocumentoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: validation.error.issues[0]?.message ?? 'Datos inválidos',
        });
      }

      const data = await documentoService.cambiarEstado(
        req.params.id as string,
        validation.data,
      );
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: 'Documento no encontrado' });
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al cambiar estado del documento:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await documentoService.delete(req.params.id as string);
      res
        .status(200)
        .json({ success: true, message: 'Documento eliminado correctamente' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res
          .status(404)
          .json({ success: false, message: 'Documento no encontrado' });
      }
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },
};
