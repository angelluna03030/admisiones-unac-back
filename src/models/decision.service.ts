import { prisma } from '../db/prisma.service';
import type {
  EstadoSolicitud,
  Prisma,
  TipoDecision,
} from '../../generated/prisma/client';
import { solicitudService } from './solicitud.service';
import type {
  CreateDecisionDto,
  QueryDecisionDto,
  RatificarDecisionDto,
  UpdateDecisionDto,
} from '../domain/decision/decision.schema';

const usuarioSelect = {
  select: { id: true, nombres: true, apellidos: true, rol: true },
};

const include = {
  solicitud: {
    select: {
      id: true,
      codigo: true,
      estado: true,
      aspirante: {
        select: { nombres: true, apellidos: true, numeroDocumento: true },
      },
      programa: { select: { nombre: true } },
      entrevistas: {
        select: {
          tipo: true,
          estado: true,
          evaluacionCapellania: { select: { promedio: true } },
          evaluacionAcademica: { select: { promedio: true } },
        },
      },
    },
  },
  tomadaPor: usuarioSelect,
  ratificadaPor: usuarioSelect,
} satisfies Prisma.DecisionAdmisionInclude;

// Estado de la solicitud mientras la decisión espera ratificación de Vicerrectoría
const ESTADO_AL_DECIDIR: Record<TipoDecision, EstadoSolicitud> = {
  NOTIFICAR_ADMISION: 'EN_RATIFICACION',
  RECHAZAR: 'EN_RATIFICACION',
  SOLICITAR_CORRECCION_PERFIL: 'CORRECCION_PERFIL',
};

// Estado de la solicitud cuando Vicerrectoría ratifica la decisión
const ESTADO_AL_RATIFICAR: Record<TipoDecision, EstadoSolicitud> = {
  NOTIFICAR_ADMISION: 'ADMITIDO',
  RECHAZAR: 'RECHAZADO',
  SOLICITAR_CORRECCION_PERFIL: 'CORRECCION_PERFIL',
};

export class DecisionError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}

const buscarPendiente = async (id: string) => {
  const decision = await prisma.decisionAdmision.findUnique({ where: { id } });
  if (!decision) throw new DecisionError('Decisión no encontrada', 404);
  if (decision.estadoRatificacion !== 'PENDIENTE') {
    throw new DecisionError(
      'La decisión ya fue revisada por Vicerrectoría y no se puede modificar',
    );
  }
  return decision;
};

export const decisionService = {
  getAll: async (query: QueryDecisionDto = {}) => {
    const where: Prisma.DecisionAdmisionWhereInput = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.estadoRatificacion)
      where.estadoRatificacion = query.estadoRatificacion;
    if (query.solicitudId) where.solicitudId = query.solicitudId;

    return prisma.decisionAdmision.findMany({
      where,
      include,
      orderBy: { tomadaEn: 'desc' },
    });
  },

  /** Registra la decisión de Coordinación y lleva la solicitud a su etapa siguiente. */
  create: async (data: CreateDecisionDto, tomadaPorId: string) => {
    const pendiente = await prisma.decisionAdmision.findFirst({
      where: { solicitudId: data.solicitudId, estadoRatificacion: 'PENDIENTE' },
    });
    if (pendiente) {
      throw new DecisionError(
        'Esta solicitud ya tiene una decisión pendiente de ratificación',
      );
    }

    const decision = await prisma.decisionAdmision.create({
      data: {
        solicitudId: data.solicitudId,
        tipo: data.tipo,
        tomadaPorId,
        justificacion: data.justificacion || null,
      },
      include,
    });
    await solicitudService.cambiarEstado(
      data.solicitudId,
      ESTADO_AL_DECIDIR[data.tipo],
    );
    return decision;
  },

  update: async (id: string, data: UpdateDecisionDto) => {
    const actual = await buscarPendiente(id);

    const decision = await prisma.decisionAdmision.update({
      where: { id },
      data: {
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.justificacion !== undefined && {
          justificacion: data.justificacion || null,
        }),
      },
      include,
    });
    if (data.tipo && data.tipo !== actual.tipo) {
      await solicitudService.cambiarEstado(
        actual.solicitudId,
        ESTADO_AL_DECIDIR[data.tipo],
      );
    }
    return decision;
  },

  /**
   * Vicerrectoría ratifica (la solicitud pasa a Admitido/Rechazado) o no ratifica
   * (la solicitud vuelve al loop de corrección de perfil).
   */
  ratificar: async (
    id: string,
    data: RatificarDecisionDto,
    ratificadaPorId: string,
  ) => {
    const actual = await buscarPendiente(id);

    const decision = await prisma.decisionAdmision.update({
      where: { id },
      data: {
        estadoRatificacion: data.estadoRatificacion,
        ratificadaPorId,
        ratificadaEn: new Date(),
        comentarioRatificacion: data.comentarioRatificacion || null,
      },
      include,
    });

    const estadoSolicitud =
      data.estadoRatificacion === 'RATIFICADA'
        ? ESTADO_AL_RATIFICAR[actual.tipo]
        : 'CORRECCION_PERFIL';
    await solicitudService.cambiarEstado(actual.solicitudId, estadoSolicitud);
    return decision;
  },

  delete: async (id: string) => {
    await buscarPendiente(id);
    return prisma.decisionAdmision.delete({ where: { id } });
  },
};
