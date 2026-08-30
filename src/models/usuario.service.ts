import { prisma } from '../db/prisma.service';
import type {
  CreateUsuarioDto,
  UpdateUsuarioDto,
} from '../domain/usuario/usuario.schema';

export const usuarioService = {
  getAll: async () => {
    return prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });
  },

  getById: async (id: string) => {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  create: async (data: CreateUsuarioDto) => {
    return prisma.usuario.create({ data });
  },

  update: async (id: string, data: UpdateUsuarioDto) => {
    return prisma.usuario.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    // Recomendación: En lugar de borrar físicamente, desactivamos el usuario
    return prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });
  },
};
