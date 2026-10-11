import { prisma } from '../db/prisma.service';
import { normalizarTelefono } from './whatsapp.service';

export type EventoEntrevista = 'PROGRAMADA' | 'ACTUALIZADA';

export const notificacionService = {
  /**
   * Envía los datos de la entrevista al webhook de n8n, que redacta un mensaje
   * personalizado con IA y lo envía por WhatsApp al aspirante.
   * Nunca lanza: un fallo en la notificación no debe afectar el guardado.
   */
  notificarEntrevista: async (
    entrevistaId: string,
    evento: EventoEntrevista,
  ) => {
    const url = process.env.N8N_WEBHOOK_ENTREVISTA_URL;
    if (!url) return;

    try {
      const entrevista = await prisma.entrevista.findUnique({
        where: { id: entrevistaId },
        include: {
          solicitud: {
            select: {
              codigo: true,
              aspirante: {
                select: { nombres: true, apellidos: true, telefono: true },
              },
              programa: { select: { nombre: true } },
            },
          },
          evaluador: { select: { nombres: true, apellidos: true } },
        },
      });

      const aspirante = entrevista?.solicitud.aspirante;
      if (!entrevista || !aspirante?.telefono) {
        console.warn(
          `Entrevista ${entrevistaId}: el aspirante no tiene teléfono, no se envía WhatsApp`,
        );
        return;
      }
      if (entrevista.estado === 'COMPLETADA') return;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          evento,
          entrevistaId: entrevista.id,
          telefono: normalizarTelefono(aspirante.telefono),
          aspirante: `${aspirante.nombres} ${aspirante.apellidos}`,
          nombres: aspirante.nombres,
          programa: entrevista.solicitud.programa.nombre,
          codigoSolicitud: entrevista.solicitud.codigo,
          tipo: entrevista.tipo,
          estado: entrevista.estado,
          evaluador: entrevista.evaluador
            ? `${entrevista.evaluador.nombres} ${entrevista.evaluador.apellidos}`
            : null,
          fechaProgramada: entrevista.fechaProgramada,
          fechaTexto: entrevista.fechaProgramada?.toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            dateStyle: 'full',
            timeStyle: 'short',
          }),
          modalidad: entrevista.modalidad,
          lugarOEnlace: entrevista.lugarOEnlace,
          motivoReprogramacion: entrevista.motivoReprogramacion,
        }),
      });

      if (!response.ok) {
        console.error(
          `Webhook de n8n respondió ${response.status} al notificar la entrevista ${entrevistaId}`,
        );
      }
    } catch (error) {
      console.error('Error al notificar la entrevista por WhatsApp:', error);
    }
  },
};
