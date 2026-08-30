import type { Request, Response, NextFunction } from 'express';

// Extiende el tipo Request para incluir 'user'
export interface AuthRequest extends Request {
  user?: {
    id: string;
    rol: string;
  };
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // ⚠️ NOTA: Aquí deberías conectar tu lógica real de JWT/Session.
    // Para pruebas fáciles, puedes descomentar la siguiente línea para simular un usuario ADMIN:
    // req.user = { id: 'mock-id', rol: 'ADMIN' };

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'No autorizado. Inicie sesión.' });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};
