import { prisma } from '../db/prisma.service';
import type {
  ChatMessageDto,
  PreinscripcionChatDto,
} from '../domain/chat/chat.schema';

export const chatService = {
  /**
   * Reenvía el mensaje del visitante al agente de n8n (DeepSeek) y devuelve su respuesta.
   * n8n conserva el historial de la conversación por sessionId.
   */
  responder: async ({ sessionId, message }: ChatMessageDto) => {
    const url = process.env.N8N_WEBHOOK_CHAT_URL;
    if (!url) throw new Error('N8N_WEBHOOK_CHAT_URL no está configurada');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(90_000),
      body: JSON.stringify({ sessionId, message }),
    });
    if (!response.ok) {
      throw new Error(
        `n8n respondió ${response.status}: ${await response.text()}`,
      );
    }

    const data = (await response.json()) as { reply?: string; output?: string };
    return data.reply ?? data.output ?? '';
  },

  programasActivos: async () => {
    return prisma.programaAcademico.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        facultad: true,
        jornada: true,
      },
      orderBy: { nombre: 'asc' },
    });
  },

  /**
   * Registra al aspirante (o reutiliza el existente por documento/correo) y le
   * abre una solicitud en el programa elegido si aún no tiene una activa.
   */
  preinscribir: async (data: PreinscripcionChatDto) => {
    const programa = await prisma.programaAcademico.findFirst({
      where: { id: data.programaId, activo: true },
      select: { id: true, nombre: true },
    });
    if (!programa)
      return {
        ok: false as const,
        error: 'El programa no existe o no está activo',
      };

    let aspirante = await prisma.aspirante.findFirst({
      where: {
        OR: [
          { numeroDocumento: data.numeroDocumento },
          { correo: data.correo },
        ],
      },
    });

    if (aspirante && aspirante.numeroDocumento !== data.numeroDocumento) {
      return {
        ok: false as const,
        error: 'Ese correo ya está registrado con otro número de documento',
      };
    }

    const yaRegistrado = !!aspirante;
    if (aspirante) {
      aspirante = await prisma.aspirante.update({
        where: { id: aspirante.id },
        data: { telefono: data.telefono },
      });
    } else {
      aspirante = await prisma.aspirante.create({
        data: {
          nombres: data.nombres,
          apellidos: data.apellidos,
          tipoDocumento: data.tipoDocumento,
          numeroDocumento: data.numeroDocumento,
          correo: data.correo,
          telefono: data.telefono,
        },
      });
    }

    const existente = await prisma.solicitud.findFirst({
      where: {
        aspiranteId: aspirante.id,
        programaId: programa.id,
        estado: { not: 'ARCHIVADO' },
      },
      select: { codigo: true, estado: true },
    });

    const solicitud =
      existente ??
      (await prisma.solicitud.create({
        data: {
          aspiranteId: aspirante.id,
          programaId: programa.id,
          estado: 'FORMULARIO_COMPLETADO',
          formularioCompletadoEn: new Date(),
        },
        select: { codigo: true, estado: true },
      }));

    return {
      ok: true as const,
      aspirante: `${aspirante.nombres} ${aspirante.apellidos}`,
      programa: programa.nombre.trim(),
      codigoSolicitud: solicitud.codigo,
      estadoSolicitud: solicitud.estado,
      yaRegistrado,
      solicitudYaExistia: !!existente,
    };
  },
};
