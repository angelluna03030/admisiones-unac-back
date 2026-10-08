import { prisma } from '../db/prisma.service';
import type { EstadoSolicitud, Prisma } from '../../generated/prisma/client';
import type {
  CreateSolicitudDto,
  QuerySolicitudDto,
  UpdateSolicitudDto,
} from '../domain/solicitud/solicitud.schema';

// Marca de tiempo que se registra la primera vez que la solicitud entra a cada estado
const HITO_POR_ESTADO: Partial<
  Record<EstadoSolicitud, keyof Prisma.SolicitudUncheckedUpdateInput>
> = {
  FORMULARIO_COMPLETADO: 'formularioCompletadoEn',
  PAGO_INSCRIPCION: 'pagoInscripcionEn',
  VALIDACION_REQUISITOS: 'fechaValidacion',
  ADMITIDO_PRELIMINAR: 'aprobadoPreliminarEn',
  MATRICULADO: 'matriculaPagadaEn',
  CUENTA_ACTIVADA: 'cuentaActivadaEn',
  ARCHIVADO: 'archivadoEn',
};

const listSelect = {
  id: true,
  codigo: true,
  estado: true,
  puntajeIcfes: true,
  requisitosValidados: true,
  createdAt: true,
  updatedAt: true,
  aspirante: {
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      tipoDocumento: true,
      numeroDocumento: true,
      correo: true,
    },
  },
  programa: { select: { id: true, nombre: true, codigo: true } },
  _count: { select: { entrevistas: true, documentos: true } },
} satisfies Prisma.SolicitudSelect;

export const solicitudService = {
  getAll: async (query: QuerySolicitudDto) => {
    const { page, limit, search, estado, programaId, aspiranteId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SolicitudWhereInput = {};
    if (estado) where.estado = estado;
    if (programaId) where.programaId = programaId;
    if (aspiranteId) where.aspiranteId = aspiranteId;
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { aspirante: { nombres: { contains: search, mode: 'insensitive' } } },
        { aspirante: { apellidos: { contains: search, mode: 'insensitive' } } },
        {
          aspirante: {
            numeroDocumento: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.solicitud.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: listSelect,
      }),
      prisma.solicitud.count({ where }),
    ]);

    return { data, total, page, limit };
  },

  getById: async (id: string) => {
    return prisma.solicitud.findUnique({
      where: { id },
      include: {
        aspirante: true,
        programa: true,
        validadoPor: { select: { id: true, nombres: true, apellidos: true } },
        documentos: { orderBy: { tipo: 'asc' } },
        entrevistas: {
          orderBy: { fechaProgramada: 'asc' },
          include: {
            evaluador: {
              select: { id: true, nombres: true, apellidos: true, rol: true },
            },
            evaluacionCapellania: true,
            evaluacionAcademica: true,
          },
        },
        decisiones: {
          orderBy: { tomadaEn: 'desc' },
          include: {
            tomadaPor: { select: { nombres: true, apellidos: true } },
            ratificadaPor: { select: { nombres: true, apellidos: true } },
          },
        },
        observaciones: {
          orderBy: { createdAt: 'desc' },
          include: {
            emitidaPor: { select: { nombres: true, apellidos: true } },
          },
        },
      },
    });
  },

  create: async (data: CreateSolicitudDto) => {
    return prisma.solicitud.create({
      data: {
        aspiranteId: data.aspiranteId,
        programaId: data.programaId,
        puntajeIcfes: data.puntajeIcfes ?? null,
        valorPagoInscripcion: data.valorPagoInscripcion ?? null,
        estado: 'FORMULARIO_COMPLETADO',
        formularioCompletadoEn: new Date(),
      },
      select: listSelect,
    });
  },

  update: async (id: string, data: UpdateSolicitudDto) => {
    const { fechaLimiteRespuesta, ...rest } = data;
    return prisma.solicitud.update({
      where: { id },
      data: {
        ...rest,
        ...(fechaLimiteRespuesta !== undefined && {
          fechaLimiteRespuesta: fechaLimiteRespuesta
            ? new Date(fechaLimiteRespuesta)
            : null,
        }),
      },
      select: listSelect,
    });
  },

  /**
   * Cambia el estado de la solicitud y registra el hito correspondiente
   * (sin sobrescribir la fecha si ya estaba registrada).
   */
  cambiarEstado: async (id: string, estado: EstadoSolicitud) => {
    const actual = await prisma.solicitud.findUnique({ where: { id } });
    if (!actual) return null;

    const data: Prisma.SolicitudUncheckedUpdateInput = { estado };
    const hito = HITO_POR_ESTADO[estado];
    if (hito && !actual[hito as keyof typeof actual]) {
      (data as Record<string, unknown>)[hito] = new Date();
    }
    if (estado === 'ADMITIDO_PRELIMINAR') {
      data.requisitosValidados = true;
    }

    return prisma.solicitud.update({ where: { id }, data, select: listSelect });
  },
};
