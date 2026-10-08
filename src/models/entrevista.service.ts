import { prisma } from '../db/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import type {
  CreateEntrevistaDto,
  EvaluacionAcademicaDto,
  EvaluacionCapellaniaDto,
  QueryEntrevistaDto,
  UpdateEntrevistaDto,
} from '../domain/entrevista/entrevista.schema';

const promedio = (valores: number[]) =>
  valores.reduce((a, b) => a + b, 0) / valores.length;

export const entrevistaService = {
  getAll: async (query: QueryEntrevistaDto = {}) => {
    const where: Prisma.EntrevistaWhereInput = {};
    if (query.estado) where.estado = query.estado;
    if (query.tipo) where.tipo = query.tipo;
    if (query.solicitudId) where.solicitudId = query.solicitudId;
    if (query.evaluadorId) where.evaluadorId = query.evaluadorId;

    return prisma.entrevista.findMany({
      where,
      include: {
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
        evaluador: {
          select: { id: true, nombres: true, apellidos: true, rol: true },
        },
        evaluacionCapellania: { select: { promedio: true } },
        evaluacionAcademica: { select: { promedio: true } },
      },
      orderBy: { fechaProgramada: 'desc' },
    });
  },

  getById: async (id: string) => {
    return prisma.entrevista.findUnique({
      where: { id },
      include: {
        solicitud: {
          select: {
            id: true,
            codigo: true,
            aspirante: {
              select: {
                nombres: true,
                apellidos: true,
                numeroDocumento: true,
                correo: true,
              },
            },
            programa: { select: { nombre: true } },
          },
        },
        evaluador: {
          select: { id: true, nombres: true, apellidos: true, rol: true },
        },
        evaluacionAcademica: true,
        evaluacionCapellania: true,
      },
    });
  },

  create: async (data: CreateEntrevistaDto) => {
    return prisma.entrevista.create({
      data: {
        solicitudId: data.solicitudId,
        tipo: data.tipo,
        evaluadorId: data.evaluadorId || null,
        fechaProgramada: new Date(data.fechaProgramada),
        modalidad: data.modalidad || null,
        lugarOEnlace: data.lugarOEnlace || null,
        estado: 'PENDIENTE',
      },
      include: {
        evaluador: { select: { nombres: true, apellidos: true } },
        solicitud: {
          select: {
            codigo: true,
            aspirante: { select: { nombres: true, apellidos: true } },
          },
        },
      },
    });
  },

  update: async (id: string, data: UpdateEntrevistaDto) => {
    const updateData: any = { ...data };
    if (data.fechaProgramada)
      updateData.fechaProgramada = new Date(data.fechaProgramada);
    if (data.fechaRealizada)
      updateData.fechaRealizada = new Date(data.fechaRealizada);

    return prisma.entrevista.update({
      where: { id },
      data: updateData,
    });
  },

  delete: async (id: string) => {
    return prisma.entrevista.delete({ where: { id } });
  },

  /**
   * Registra (o corrige) la rúbrica de la entrevista según su tipo, recalcula
   * el promedio y marca la entrevista como COMPLETADA.
   * Devuelve null si la entrevista no existe.
   */
  evaluar: async (
    id: string,
    tipo: 'CAPELLANIA' | 'ACADEMICA',
    data: EvaluacionCapellaniaDto | EvaluacionAcademicaDto,
  ) => {
    const entrevista = await prisma.entrevista.findUnique({ where: { id } });
    if (!entrevista) return null;

    const completar = prisma.entrevista.update({
      where: { id },
      data: {
        estado: 'COMPLETADA',
        fechaRealizada: entrevista.fechaRealizada ?? new Date(),
      },
    });

    if (tipo === 'CAPELLANIA') {
      const d = data as EvaluacionCapellaniaDto;
      const valores = {
        valoresPrincipiosEticos: d.valoresPrincipiosEticos,
        proyectoDeVida: d.proyectoDeVida,
        convivenciaComunitaria: d.convivenciaComunitaria,
        compromisoReglamento: d.compromisoReglamento,
        actitudDisposicion: d.actitudDisposicion,
        promedio: promedio([
          d.valoresPrincipiosEticos,
          d.proyectoDeVida,
          d.convivenciaComunitaria,
          d.compromisoReglamento,
          d.actitudDisposicion,
        ]),
        observaciones: d.observaciones || null,
      };
      const [evaluacion] = await prisma.$transaction([
        prisma.evaluacionCapellania.upsert({
          where: { entrevistaId: id },
          create: { entrevistaId: id, ...valores },
          update: { ...valores, evaluadaEn: new Date() },
        }),
        completar,
      ]);
      return evaluacion;
    }

    const d = data as EvaluacionAcademicaDto;
    const valores = {
      aptitudAcademica: d.aptitudAcademica,
      perfilParaElPrograma: d.perfilParaElPrograma,
      habilidadesComunicacion: d.habilidadesComunicacion,
      pensamientoCritico: d.pensamientoCritico,
      motivacionIntrinseca: d.motivacionIntrinseca,
      promedio: promedio([
        d.aptitudAcademica,
        d.perfilParaElPrograma,
        d.habilidadesComunicacion,
        d.pensamientoCritico,
        d.motivacionIntrinseca,
      ]),
      conceptoAcademico: d.conceptoAcademico || null,
      recomendacionFinal: d.recomendacionFinal || null,
    };
    const [evaluacion] = await prisma.$transaction([
      prisma.evaluacionAcademica.upsert({
        where: { entrevistaId: id },
        create: { entrevistaId: id, ...valores },
        update: { ...valores, evaluadaEn: new Date() },
      }),
      completar,
    ]);
    return evaluacion;
  },
};
