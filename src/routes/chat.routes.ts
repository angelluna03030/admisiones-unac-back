import { Router } from 'express';
import {
  chatController,
  limitarChat,
  requireToolsToken,
} from '../controllers/chat.controller';

export const chatRoutes = Router();

// Chat público de la landing: el front envía aquí los mensajes del visitante
chatRoutes.post('/', limitarChat, chatController.enviarMensaje);

// Herramientas que usa el agente de n8n (protegidas con x-chat-token)
chatRoutes.get('/tools/programas', requireToolsToken, chatController.programas);
chatRoutes.post(
  '/tools/preinscripcion',
  requireToolsToken,
  chatController.preinscribir,
);
chatRoutes.post(
  '/tools/whatsapp',
  requireToolsToken,
  chatController.enviarWhatsapp,
);
