import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.service';
import {
  getJwtSecret,
  type UsuarioSesion,
} from '../middlewares/auth.middleware';
import type { CambiarPasswordDto, LoginDto } from '../domain/auth/auth.schema';

export const SESION_HORAS = 8;

const sesionSelect = {
  id: true,
  nombres: true,
  apellidos: true,
  correo: true,
  rol: true,
} as const;

// Hash válido que no corresponde a ninguna contraseña: iguala el tiempo de respuesta cuando el correo no existe
const HASH_FICTICIO =
  '$2b$10$fOgyIYpaX7mMwnSFew.fVOZcH89qSwVCThBNah5iC1BgL/g3aG/MG';

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export const authService = {
  /** Devuelve el usuario y su token, o null si las credenciales no son válidas. */
  login: async ({ correo, password }: LoginDto) => {
    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    // Se compara igual aunque el usuario no exista, para no revelar qué correos están registrados
    const hash = usuario?.passwordHash ?? HASH_FICTICIO;
    const valida = await bcrypt.compare(password, hash);
    if (!usuario || !usuario.activo || !usuario.passwordHash || !valida)
      return null;

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() },
    });

    const token = jwt.sign(
      { sub: usuario.id, rol: usuario.rol },
      getJwtSecret(),
      {
        expiresIn: `${SESION_HORAS}h`,
      },
    );
    const sesion: UsuarioSesion = {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      rol: usuario.rol,
    };
    return { usuario: sesion, token };
  },

  me: (id: string) =>
    prisma.usuario.findUnique({ where: { id }, select: sesionSelect }),

  cambiarPassword: async (id: string, data: CambiarPasswordDto) => {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario?.passwordHash) return false;
    const valida = await bcrypt.compare(
      data.passwordActual,
      usuario.passwordHash,
    );
    if (!valida) return false;

    await prisma.usuario.update({
      where: { id },
      data: { passwordHash: await hashPassword(data.passwordNueva) },
    });
    return true;
  },
};
