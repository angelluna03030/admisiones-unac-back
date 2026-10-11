import type { NextFunction, Request, Response } from 'express';
import { chatService } from '../models/chat.service';
import { whatsappService } from '../models/whatsapp.service';
import {
  chatMessageSchema,
  preinscripcionChatSchema,
  whatsappChatSchema,
} from '../domain/chat/chat.schema';

// Límite simple en memoria para el chat público: N mensajes por minuto por IP
const LIMITE_POR_MINUTO = 20;
const ventanas = new Map<string, { inicio: number; total: number }>();

export const limitarChat = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.ip ?? 'desconocida';
  const ahora = Date.now();
  const ventana = ventanas.get(ip);

  if (!ventana || ahora - ventana.inicio > 60_000) {
    ventanas.set(ip, { inicio: ahora, total: 1 });
    return next();
  }
  if (ventana.total >= LIMITE_POR_MINUTO) {
    return res.status(429).json({
      success: false,
      message:
        'Estás enviando muchos mensajes. Espera un momento e intenta de nuevo.',
    });
  }
  ventana.total++;
  next();
};

/** Protege las herramientas que usa el agente de n8n con un token compartido. */
export const requireToolsToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = process.env.CHAT_TOOLS_TOKEN;
  if (!token || req.header('x-chat-token') !== token) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  next();
};

export const chatController = {
  enviarMensaje: async (req: Request, res: Response) => {
    const validation = chatMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0]?.message ?? 'Mensaje inválido',
      });
    }

    try {
      const reply = await chatService.responder(validation.data);
      res.status(200).json({ success: true, data: { reply } });
    } catch (error) {
      console.error('Error en el chat con n8n:', error);
      res.status(502).json({
        success: false,
        message:
          'El asistente no está disponible en este momento. Intenta más tarde.',
      });
    }
  },

  programas: async (_req: Request, res: Response) => {
    try {
      const data = await chatService.programasActivos();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al listar programas para el chat:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  preinscribir: async (req: Request, res: Response) => {
    const validation = preinscripcionChatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
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
      console.error('Error al pre-inscribir desde el chat:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  enviarWhatsapp: async (req: Request, res: Response) => {
    const validation = whatsappChatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    try {
      await whatsappService.enviarTexto(
        validation.data.telefono,
        validation.data.mensaje,
      );
      res
        .status(200)
        .json({ success: true, message: 'Mensaje enviado por WhatsApp' });
    } catch (error) {
      console.error('Error al enviar WhatsApp desde el chat:', error);
      res.status(502).json({
        success: false,
        message: 'No se pudo enviar el WhatsApp. Verifica el número.',
      });
    }
  },
};
