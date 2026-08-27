import type { Request, Response } from 'express';
import { prisma } from '../db/prisma.service';

export const programaController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const search = req.query.search as string;

      const where = search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' as const } },
              { codigo: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [data, total] = await Promise.all([
        prisma.programaAcademico.findMany({
          where,
          skip,
          take: limit,
          orderBy: { nombre: 'asc' },
        }),
        prisma.programaAcademico.count({ where }),
      ]);

      res.status(200).json({ success: true, data, total, page, limit });
    } catch (error) {
      console.error('Error al obtener programas:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { nombre, codigo, facultad, jornada } = req.body;
      if (!nombre || !codigo) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y código son obligatorios',
        });
      }

      const data = await prisma.programaAcademico.create({
        data: {
          nombre,
          codigo,
          facultad: facultad || null,
          jornada: jornada || null,
        },
      });

      res.status(201).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un programa con ese código',
        });
      }
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (typeof id !== 'string') {
        return res.status(400).json({ success: false, message: 'Id inválido' });
      }
      const { nombre, codigo, facultad, jornada } = req.body;

      const data = await prisma.programaAcademico.update({
        where: { id },
        data: { nombre, codigo, facultad, jornada },
      });

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res
          .status(404)
          .json({ success: false, message: 'Programa no encontrado' });
      }
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  toggleStatus: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (typeof id !== 'string') {
        return res.status(400).json({ success: false, message: 'Id inválido' });
      }
      const programa = await prisma.programaAcademico.findUnique({
        where: { id },
      });
      if (!programa)
        return res
          .status(404)
          .json({ success: false, message: 'No encontrado' });

      const updated = await prisma.programaAcademico.update({
        where: { id },
        data: { activo: !programa.activo },
      });

      res.status(200).json({
        success: true,
        message: `Programa ${updated.activo ? 'activado' : 'desactivado'} correctamente`,
        data: { activo: updated.activo },
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },
};
