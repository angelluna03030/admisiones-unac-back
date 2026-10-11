import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE } from '../middlewares/auth.middleware';
import { authService, SESION_HORAS } from '../models/auth.service';
import { cambiarPasswordSchema, loginSchema } from '../domain/auth/auth.schema';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

// Límite de intentos de login por IP: 10 cada 15 minutos
const MAX_INTENTOS = 10;
const VENTANA_MS = 15 * 60_000;
const intentos = new Map<string, { inicio: number; total: number }>();

export const limitarLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.ip ?? 'desconocida';
  const ahora = Date.now();
  const registro = intentos.get(ip);

  if (!registro || ahora - registro.inicio > VENTANA_MS) {
    intentos.set(ip, { inicio: ahora, total: 1 });
    return next();
  }
  if (registro.total >= MAX_INTENTOS) {
    return res.status(429).json({
      success: false,
      message: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
    });
  }
  registro.total++;
  next();
};

export const authController = {
  login: async (req: Request, res: Response) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0]?.message ?? 'Datos inválidos',
      });
    }

    try {
      const resultado = await authService.login(validation.data);
      if (!resultado) {
        return res.status(401).json({
          success: false,
          message:
            'Correo o contraseña incorrectos, o el usuario no tiene acceso.',
        });
      }

      intentos.delete(req.ip ?? 'desconocida');
      res.cookie(AUTH_COOKIE, resultado.token, {
        ...cookieOptions,
        maxAge: SESION_HORAS * 60 * 60 * 1000,
      });
      res.status(200).json({ success: true, data: resultado.usuario });
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  logout: (_req: Request, res: Response) => {
    res.clearCookie(AUTH_COOKIE, cookieOptions);
    res.status(200).json({ success: true, message: 'Sesión cerrada' });
  },

  me: (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: req.user });
  },

  cambiarPassword: async (req: Request, res: Response) => {
    const validation = cambiarPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0]?.message ?? 'Datos inválidos',
      });
    }

    try {
      const ok = await authService.cambiarPassword(
        req.user!.id,
        validation.data,
      );
      if (!ok) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual no es correcta',
        });
      }
      res
        .status(200)
        .json({ success: true, message: 'Contraseña actualizada' });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },
};
