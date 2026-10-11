import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.service';
import type { RolUsuario } from '../../generated/prisma/client';

export const AUTH_COOKIE = 'admisiones_token';

export interface UsuarioSesion {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolUsuario;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UsuarioSesion;
    }
  }
}

// Se mantiene por compatibilidad con código existente
export type AuthRequest = Request;

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no está configurado en el .env');
  return secret;
};

const leerToken = (req: Request): string | null => {
  const cookie = req.cookies?.[AUTH_COOKIE];
  if (cookie) return cookie;
  const header = req.header('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
};

/**
 * Exige una sesión válida. El usuario se consulta en cada petición para que
 * un cambio de rol o una desactivación tengan efecto inmediato.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = leerToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'No autorizado. Inicia sesión.' });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { sub: string };
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        rol: true,
        activo: true,
      },
    });
    if (!usuario || !usuario.activo) {
      return res
        .status(401)
        .json({
          success: false,
          message: 'Tu sesión ya no es válida. Inicia sesión de nuevo.',
        });
    }

    const { activo: _activo, ...sesion } = usuario;
    req.user = sesion;
    next();
  } catch {
    return res
      .status(401)
      .json({
        success: false,
        message: 'Tu sesión expiró. Inicia sesión de nuevo.',
      });
  }
};

/** Exige uno de los roles indicados. ADMIN siempre tiene acceso. Usar después de requireAuth. */
export const requireRole = (allowedRoles: RolUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'No autorizado. Inicia sesión.' });
    }

    if (req.user.rol !== 'ADMIN' && !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Tu rol no tiene permiso para realizar esta acción.',
      });
    }

    next();
  };
};
