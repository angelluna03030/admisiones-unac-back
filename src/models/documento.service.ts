import { prisma } from '../db/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import {
  DOCUMENTOS_OBLIGATORIOS,
  type CambiarEstadoDocumentoDto,
  type CreateDocumentoDto,
  type QueryDocumentoDto,
  type UpdateDocumentoDto,
} from '../domain/documento/documento.schema';

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
    },
  },
} satisfies Prisma.DocumentoInclude;

/**
 * Refleja en la solicitud el resultado de la validación documental. Solo toca
 * las banderas cuyo documento existe (las que Admisiones marcó a mano sin
 * documento se respetan) y solo marca los requisitos como validados cuando
 * todos los documentos obligatorios están VALIDADOS.
 */
const sincronizarSolicitud = async (solicitudId: string) => {
  const documentos = await prisma.documento.findMany({
    where: { solicitudId },
    select: { tipo: true, estado: true },
  });
  const existe = (tipo: string) => documentos.some((d) => d.tipo === tipo);
  const validado = (tipo: string) =>
    documentos.some((d) => d.tipo === tipo && d.estado === 'VALIDADO');
  const requisitosCompletos = DOCUMENTOS_OBLIGATORIOS.every(validado);

  const actual = await prisma.solicitud.findUnique({
    where: { id: solicitudId },
    select: { fechaValidacion: true },
  });

  const data: Prisma.SolicitudUpdateInput = {};
  if (existe('CERTIFICADO_BACHILLER'))
    data.bachillerValidado = validado('CERTIFICADO_BACHILLER');
  if (existe('RESULTADO_ICFES'))
    data.icfesValidado = validado('RESULTADO_ICFES');
  if (requisitosCompletos) {
    data.requisitosValidados = true;
    if (!actual?.fechaValidacion) data.fechaValidacion = new Date();
  }
  if (Object.keys(data).length === 0) return;

  await prisma.solicitud.update({ where: { id: solicitudId }, data });
};

export const documentoService = {
  getAll: async (query: QueryDocumentoDto = {}) => {
    const where: Prisma.DocumentoWhereInput = {};
    if (query.estado) where.estado = query.estado;
    if (query.tipo) where.tipo = query.tipo;
    if (query.solicitudId) where.solicitudId = query.solicitudId;

    return prisma.documento.findMany({
      where,
      include,
      orderBy: { updatedAt: 'desc' },
    });
  },

  create: async (data: CreateDocumentoDto) => {
    const conArchivo = !!data.urlArchivo;
    const documento = await prisma.documento.create({
      data: {
        solicitudId: data.solicitudId,
        tipo: data.tipo,
        urlArchivo: data.urlArchivo || null,
        observacion: data.observacion || null,
        estado: conArchivo ? 'CARGADO' : 'PENDIENTE',
        cargadoEn: conArchivo ? new Date() : null,
      },
      include,
    });
    await sincronizarSolicitud(data.solicitudId);
    return documento;
  },

  /** Actualiza el archivo u observación; un archivo nuevo vuelve el documento a CARGADO. */
  update: async (id: string, data: UpdateDocumentoDto) => {
    const actual = await prisma.documento.findUnique({ where: { id } });
    if (!actual) return null;

    const archivoNuevo =
      data.urlArchivo !== undefined &&
      !!data.urlArchivo &&
      data.urlArchivo !== actual.urlArchivo;

    const documento = await prisma.documento.update({
      where: { id },
      data: {
        ...(data.urlArchivo !== undefined && {
          urlArchivo: data.urlArchivo || null,
        }),
        ...(data.observacion !== undefined && {
          observacion: data.observacion || null,
        }),
        ...(archivoNuevo && {
          estado: 'CARGADO',
          cargadoEn: new Date(),
          validadoEn: null,
        }),
      },
      include,
    });
    if (archivoNuevo) await sincronizarSolicitud(actual.solicitudId);
    return documento;
  },

  cambiarEstado: async (id: string, data: CambiarEstadoDocumentoDto) => {
    const actual = await prisma.documento.findUnique({ where: { id } });
    if (!actual) return null;

    const documento = await prisma.documento.update({
      where: { id },
      data: {
        estado: data.estado,
        observacion:
          data.observacion !== undefined
            ? data.observacion || null
            : actual.observacion,
        validadoEn: data.estado === 'VALIDADO' ? new Date() : null,
        ...(data.estado === 'CARGADO' &&
          !actual.cargadoEn && { cargadoEn: new Date() }),
      },
      include,
    });
    await sincronizarSolicitud(actual.solicitudId);
    return documento;
  },

  delete: async (id: string) => {
    const documento = await prisma.documento.delete({ where: { id } });
    await sincronizarSolicitud(documento.solicitudId);
    return documento;
  },
};
