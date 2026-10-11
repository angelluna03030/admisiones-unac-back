import { prisma } from '../db/prisma.service';
import { hashPassword } from './auth.service';
import type {
  CreateUsuarioDto,
  UpdateUsuarioDto,
} from '../domain/usuario/usuario.schema';

const usuarioSelect = {
  id: true,
  nombres: true,
  apellidos: true,
  correo: true,
  rol: true,
  activo: true,
  ultimoAcceso: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Nunca se expone el hash: solo si el usuario tiene acceso (contraseña asignada)
const sinHash = <T extends { passwordHash: string | null }>({
  passwordHash,
  ...usuario
}: T) => ({
  ...usuario,
  tieneAcceso: !!passwordHash,
});

export const usuarioService = {
  getAll: async () => {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' },
      select: usuarioSelect,
    });
    return usuarios.map(sinHash);
  },

  getById: async (id: string) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: usuarioSelect,
    });
    return usuario ? sinHash(usuario) : null;
  },

  create: async ({ password, ...data }: CreateUsuarioDto) => {
    const usuario = await prisma.usuario.create({
      data: {
        ...data,
        correo: data.correo.toLowerCase(),
        passwordHash: password ? await hashPassword(password) : null,
      },
      select: usuarioSelect,
    });
    return sinHash(usuario);
  },

  update: async (id: string, { password, ...data }: UpdateUsuarioDto) => {
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        ...(data.correo && { correo: data.correo.toLowerCase() }),
        ...(password && { passwordHash: await hashPassword(password) }),
      },
      select: usuarioSelect,
    });
    return sinHash(usuario);
  },

  delete: async (id: string) => {
    // Recomendación: En lugar de borrar físicamente, desactivamos el usuario
    return prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: { id: true },
    });
  },
};
