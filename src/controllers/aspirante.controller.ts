import type { Request, Response } from 'express';

import { prisma } from '../db/prisma.service';
import type { Prisma } from '../../generated/prisma/client';

export const aspiranteController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const search = req.query.search as string;

      const where: Prisma.AspiranteWhereInput = search
        ? {
            OR: [
              { nombres: { contains: search, mode: 'insensitive' } },
              { apellidos: { contains: search, mode: 'insensitive' } },
              { numeroDocumento: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [data, total] = await Promise.all([
        prisma.aspirante.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.aspirante.count({ where }),
      ]);

      res.status(200).json({ success: true, data, total, page, limit });
    } catch (error) {
      console.error('Error al obtener aspirantes:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const data = await prisma.aspirante.findUnique({ where: { id } });
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: 'Aspirante no encontrado' });
      res.status(200).json({ success: true, data });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const {
        nombres,
        apellidos,
        tipoDocumento,
        numeroDocumento,
        correo,
        telefono,
        fechaNacimiento,
        direccion,
        ciudad,
      } = req.body;

      if (
        !nombres ||
        !apellidos ||
        !tipoDocumento ||
        !numeroDocumento ||
        !correo
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Datos obligatorios faltantes' });
      }

      const data = await prisma.aspirante.create({
        data: {
          nombres,
          apellidos,
          tipoDocumento,
          numeroDocumento,
          correo,
          telefono: telefono || null,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
          direccion: direccion || null,
          ciudad: ciudad || null,
        },
      });

      res.status(201).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message:
            'Ya existe un aspirante con ese número de documento o correo',
        });
      }
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const {
        nombres,
        apellidos,
        tipoDocumento,
        numeroDocumento,
        correo,
        telefono,
        fechaNacimiento,
        direccion,
        ciudad,
      } = req.body;

      const data = await prisma.aspirante.update({
        where: { id },
        data: {
          nombres,
          apellidos,
          tipoDocumento,
          numeroDocumento,
          correo,
          telefono,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
          direccion,
          ciudad,
        },
      });

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2025')
        return res
          .status(404)
          .json({ success: false, message: 'Aspirante no encontrado' });
      if (error.code === 'P2002')
        return res.status(409).json({
          success: false,
          message: 'El documento o correo ya está en uso por otro aspirante',
        });
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },
};
