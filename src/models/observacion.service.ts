import { prisma } from '../db/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import { solicitudService } from './solicitud.service';
import { whatsappService } from './whatsapp.service';
import type {
  CreateObservacionDto,
  QueryObservacionDto,
  UpdateObservacionDto,
} from '../domain/observacion/observacion.schema';

const include = {
  solicitud: {
    select: {
      id: true,
      codigo: true,
      estado: true,
      aspirante: {
        select: {
          nombres: true,
          apellidos: true,
          numeroDocumento: true,
          telefono: true,
        },
      },
      programa: { select: { nombre: true } },
    },
  },
  emitidaPor: {
    select: { id: true, nombres: true, apellidos: true, rol: true },
  },
} satisfies Prisma.ObservacionAdmisionesInclude;

type ObservacionConDatos = Prisma.ObservacionAdmisionesGetPayload<{
  include: typeof include;
}>;

const mensajeWhatsapp = (o: ObservacionConDatos) => {
  const nombre = o.solicitud.aspirante.nombres.split(' ')[0];
  return [
    `Hola ${nombre} 👋, te escribimos de *Admisiones UNAC*.`,
    '',
    `Revisamos tu solicitud al programa *${o.solicitud.programa.nombre.trim()}* y encontramos una observación que debes atender para continuar con tu proceso:`,
    '',
    `📌 *${o.motivo}*`,
    ...(o.detalle ? [o.detalle] : []),
    '',
    'Cuando la resuelvas, responde a este mensaje o escríbenos a admisiones@unac.edu.co. ¡Estamos para ayudarte! 💙',
  ].join('\n');
};

export const observacionService = {
  getAll: async (query: QueryObservacionDto = {}) => {
    const where: Prisma.ObservacionAdmisionesWhereInput = {};
    if (query.resuelta !== undefined) where.resuelta = query.resuelta;
    if (query.solicitudId) where.solicitudId = query.solicitudId;

    return prisma.observacionAdmisiones.findMany({
      where,
      include,
      orderBy: [{ resuelta: 'asc' }, { createdAt: 'desc' }],
    });
  },

  /**
   * Registra la observación, pasa la solicitud a OBSERVADO y, si se pide,
   * avisa al aspirante por WhatsApp. El fallo del WhatsApp no anula la observación.
   */
  create: async (
    { notificarWhatsapp, ...data }: CreateObservacionDto,
    emitidaPorId: string,
  ) => {
    const observacion = await prisma.observacionAdmisiones.create({
      data: {
        solicitudId: data.solicitudId,
        motivo: data.motivo,
        detalle: data.detalle || null,
        emitidaPorId,
      },
      include,
    });
    await solicitudService.cambiarEstado(data.solicitudId, 'OBSERVADO');

    let whatsapp: 'ENVIADO' | 'SIN_TELEFONO' | 'ERROR' | 'NO_SOLICITADO' =
      'NO_SOLICITADO';
    if (notificarWhatsapp) {
      const telefono = observacion.solicitud.aspirante.telefono;
      if (!telefono) {
        whatsapp = 'SIN_TELEFONO';
      } else {
        try {
          await whatsappService.enviarTexto(
            telefono,
            mensajeWhatsapp(observacion),
          );
          whatsapp = 'ENVIADO';
        } catch (error) {
          console.error(
            'Error al notificar la observación por WhatsApp:',
            error,
          );
          whatsapp = 'ERROR';
        }
      }
    }

    return { observacion, whatsapp };
  },

  update: async (id: string, data: UpdateObservacionDto) => {
    return prisma.observacionAdmisiones.update({
      where: { id },
      data: {
        ...(data.motivo && { motivo: data.motivo }),
        ...(data.detalle !== undefined && { detalle: data.detalle || null }),
      },
      include,
    });
  },

  /**
   * Marca la observación como resuelta (o la reabre). Al resolver la última
   * observación abierta, la solicitud vuelve a Validación de requisitos (loop al paso 4).
   */
  resolver: async (id: string, resuelta: boolean) => {
    const observacion = await prisma.observacionAdmisiones.update({
      where: { id },
      data: { resuelta },
      include,
    });

    const { solicitud } = observacion;
    if (resuelta && solicitud.estado === 'OBSERVADO') {
      const abiertas = await prisma.observacionAdmisiones.count({
        where: { solicitudId: solicitud.id, resuelta: false },
      });
      if (abiertas === 0) {
        await solicitudService.cambiarEstado(
          solicitud.id,
          'VALIDACION_REQUISITOS',
        );
      }
    } else if (!resuelta && solicitud.estado === 'VALIDACION_REQUISITOS') {
      await solicitudService.cambiarEstado(solicitud.id, 'OBSERVADO');
    }

    return prisma.observacionAdmisiones.findUnique({ where: { id }, include });
  },

  delete: async (id: string) => {
    return prisma.observacionAdmisiones.delete({ where: { id } });
  },
};
