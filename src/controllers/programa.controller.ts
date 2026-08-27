import type { Request, Response } from 'express';
import { prisma } from '../db/prisma.service';

export const programaController = {
  // Obtener todos los programas
  getAll: async (req: Request, res: Response) => {
    try {
      const programas = await prisma.programaAcademico.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      });
      res.status(200).json(programas);
    } catch (error) {
      console.error('Error al obtener programas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Crear un nuevo programa
  create: async (req: Request, res: Response) => {
    try {
      const { nombre, codigo, facultad, jornada } = req.body;

      // Validación básica
      if (!nombre || !codigo) {
        return res
          .status(400)
          .json({ error: 'Nombre y código son obligatorios' });
      }

      const nuevoPrograma = await prisma.programaAcademico.create({
        data: {
          nombre,
          codigo,
          facultad: facultad || null,
          jornada: jornada || null,
        },
      });

      res.status(201).json(nuevoPrograma);
    } catch (error: any) {
      // Manejo de error de unicidad (código duplicado)
      if (error.code === 'P2002') {
        return res
          .status(409)
          .json({ error: 'Ya existe un programa con ese código' });
      }
      console.error('Error al crear programa:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener un programa por ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'ID de programa inválido' });
      }

      const programa = await prisma.programaAcademico.findUnique({
        where: { id },
      });

      if (!programa) {
        return res.status(404).json({ error: 'Programa no encontrado' });
      }

      res.status(200).json(programa);
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};
