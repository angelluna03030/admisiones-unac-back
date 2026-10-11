import type { Request, Response } from 'express';
import { chatService } from '../models/chat.service';
import { preinscripcionChatSchema } from '../domain/chat/chat.schema';

export const publicController = {
  /** Crea (o reutiliza) el aspirante y abre su solicitud en el programa elegido. */
  preinscribir: async (req: Request, res: Response) => {
    const validation = preinscripcionChatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0]?.message ?? 'Datos inválidos',
      });
    }

    try {
      const resultado = await chatService.preinscribir(validation.data);
      if (!resultado.ok) {
        return res
          .status(409)
          .json({ success: false, message: resultado.error });
      }
      res.status(201).json({ success: true, data: resultado });
    } catch (error) {
      console.error('Error en la pre-inscripción pública:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },
};
