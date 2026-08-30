import { prisma } from '../db/prisma.service';
import type {
  CreateEntrevistaDto,
  UpdateEntrevistaDto,
} from '../domain/entrevista/entrevista.schema';

export const entrevistaService = {
  getAll: async () => {
    return prisma.entrevista.findMany({
      include: {
        solicitud: {
          select: {
            id: true,
            codigo: true,
            aspirante: {
              select: { nombres: true, apellidos: true, numeroDocumento: true },
            },
            programa: { select: { nombre: true } },
          },
        },
        evaluador: {
          select: { id: true, nombres: true, apellidos: true, rol: true },
        },
      },
      orderBy: { fechaProgramada: 'desc' },
    });
  },

  getById: async (id: string) => {
    return prisma.entrevista.findUnique({
      where: { id },
      include: {
        solicitud: {
          select: {
            id: true,
            codigo: true,
            aspirante: {
              select: {
                nombres: true,
                apellidos: true,
                numeroDocumento: true,
                correo: true,
              },
            },
            programa: { select: { nombre: true } },
          },
        },
        evaluador: {
          select: { id: true, nombres: true, apellidos: true, rol: true },
        },
        evaluacionAcademica: true,
        evaluacionCapellania: true,
      },
    });
  },

  create: async (data: CreateEntrevistaDto) => {
    return prisma.entrevista.create({
      data: {
        solicitudId: data.solicitudId,
        tipo: data.tipo,
        evaluadorId: data.evaluadorId || null,
        fechaProgramada: new Date(data.fechaProgramada),
        modalidad: data.modalidad || null,
        lugarOEnlace: data.lugarOEnlace || null,
        estado: 'PENDIENTE',
      },
      include: {
        evaluador: { select: { nombres: true, apellidos: true } },
        solicitud: {
          select: {
            codigo: true,
            aspirante: { select: { nombres: true, apellidos: true } },
          },
        },
      },
    });
  },

  update: async (id: string, data: UpdateEntrevistaDto) => {
    const updateData: any = { ...data };
    if (data.fechaProgramada)
      updateData.fechaProgramada = new Date(data.fechaProgramada);
    if (data.fechaRealizada)
      updateData.fechaRealizada = new Date(data.fechaRealizada);

    return prisma.entrevista.update({
      where: { id },
      data: updateData,
    });
  },

  delete: async (id: string) => {
    return prisma.entrevista.delete({ where: { id } });
  },
};
