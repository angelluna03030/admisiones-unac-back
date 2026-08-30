import { prisma } from '../db/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import type {
  CreateAspiranteDto,
  QueryAspiranteDto,
  UpdateAspiranteDto,
} from '../domain/aspirante/aspirante.schema';

export const aspiranteService = {
  getAll: async (query: QueryAspiranteDto) => {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AspiranteWhereInput = search
      ? {
          OR: [
            { nombres: { contains: search, mode: 'insensitive' } },
            { apellidos: { contains: search, mode: 'insensitive' } },
            { numeroDocumento: { contains: search, mode: 'insensitive' } },
            { correo: { contains: search, mode: 'insensitive' } },
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

    return { data, total, page, limit };
  },

  getById: async (id: string) => {
    return prisma.aspirante.findUnique({
      where: { id },
      include: {
        solicitudes: {
          select: {
            id: true,
            codigo: true,
            estado: true,
            programa: { select: { nombre: true } },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  create: async (data: CreateAspiranteDto) => {
    return prisma.aspirante.create({
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        correo: data.correo,
        telefono: data.telefono || null,
        fechaNacimiento: data.fechaNacimiento
          ? new Date(data.fechaNacimiento)
          : null,
        direccion: data.direccion || null,
        ciudad: data.ciudad || null,
      },
    });
  },

  update: async (id: string, data: UpdateAspiranteDto) => {
    return prisma.aspirante.update({
      where: { id },
      data: {
        ...data,
        fechaNacimiento: data.fechaNacimiento
          ? new Date(data.fechaNacimiento)
          : undefined,
      },
    });
  },

  delete: async (id: string) => {
    return prisma.aspirante.delete({ where: { id } });
  },
};
