import { prisma } from '../db/prisma.service';
import { Prisma, type EstadoSolicitud } from '../../generated/prisma/client';
import type {
  ActivityQueryDto,
  DashboardFilterDto,
  TrendsQueryDto,
} from '../domain/dashboard/dashboard.schema';

const DAY_MS = 24 * 60 * 60 * 1000;

// Distribución por estado: sigue el orden del enum (pasos 1-9 del BPMN)
const FUNNEL_ORDER: EstadoSolicitud[] = [
  'FORMULARIO_COMPLETADO',
  'PAGO_INSCRIPCION',
  'DOCUMENTOS_CARGADOS',
  'VALIDACION_REQUISITOS',
  'OBSERVADO',
  'ADMITIDO_PRELIMINAR',
  'EN_ENTREVISTA_CAPELLANIA',
  'EN_ENTREVISTA_ACADEMICA',
  'CORRECCION_PERFIL',
  'EN_RATIFICACION',
  'ADMITIDO',
  'MATRICULADO',
  'CUENTA_ACTIVADA',
  'RECHAZADO',
  'ARCHIVADO',
];

// Estados en los que la solicitud ya no avanza en el proceso
const ESTADOS_FINALES: EstadoSolicitud[] = [
  'ADMITIDO',
  'MATRICULADO',
  'CUENTA_ACTIVADA',
  'RECHAZADO',
  'ARCHIVADO',
];
const ESTADOS_ADMITIDOS: EstadoSolicitud[] = [
  'ADMITIDO',
  'MATRICULADO',
  'CUENTA_ACTIVADA',
];
const ESTADOS_MATRICULADOS: EstadoSolicitud[] = [
  'MATRICULADO',
  'CUENTA_ACTIVADA',
];

// Etapas acumulativas del embudo de conversión. Una solicitud "alcanzó" una
// etapa si su estado actual o sus marcas de tiempo indican que pasó por ella.
const ETAPAS_CONVERSION = [
  'Solicitud registrada',
  'Pago de inscripción',
  'Documentos cargados',
  'Requisitos validados',
  'Admitido preliminar',
  'Entrevistas',
  'Admitido',
  'Matriculado',
  'Cuenta activada',
] as const;

const RANGO_POR_ESTADO: Record<EstadoSolicitud, number> = {
  FORMULARIO_COMPLETADO: 1,
  PAGO_INSCRIPCION: 2,
  DOCUMENTOS_CARGADOS: 3,
  VALIDACION_REQUISITOS: 3,
  OBSERVADO: 3,
  ADMITIDO_PRELIMINAR: 5,
  EN_ENTREVISTA_CAPELLANIA: 6,
  EN_ENTREVISTA_ACADEMICA: 6,
  CORRECCION_PERFIL: 6,
  EN_RATIFICACION: 6,
  ADMITIDO: 7,
  MATRICULADO: 8,
  CUENTA_ACTIVADA: 9,
  RECHAZADO: 1,
  ARCHIVADO: 1,
};

const pct = (parte: number, total: number) =>
  total > 0 ? parseFloat(((parte / total) * 100).toFixed(2)) : 0;

const variacion = (actual: number, anterior: number) =>
  anterior > 0
    ? parseFloat((((actual - anterior) / anterior) * 100).toFixed(2))
    : 0;

const round = (value: number | null | undefined, decimals = 2) =>
  value === null || value === undefined
    ? null
    : parseFloat(Number(value).toFixed(decimals));

/**
 * Construye el where de solicitudes a partir de los filtros del dashboard.
 * El rango de fechas se pasa aparte para poder reutilizarlo en el período anterior.
 */
const buildWhere = (
  filters: DashboardFilterDto,
  range?: { start?: Date; end?: Date },
): Prisma.SolicitudWhereInput => {
  const where: Prisma.SolicitudWhereInput = {};

  if (range?.start || range?.end) {
    where.createdAt = {
      ...(range.start && { gte: range.start }),
      ...(range.end && { lte: range.end }),
    };
  }
  if (filters.programaId) where.programaId = filters.programaId;
  if (filters.estado) where.estado = filters.estado;

  const programa: Prisma.ProgramaAcademicoWhereInput = {};
  if (filters.facultad)
    programa.facultad = { equals: filters.facultad, mode: 'insensitive' };
  if (filters.jornada)
    programa.jornada = { equals: filters.jornada, mode: 'insensitive' };
  if (Object.keys(programa).length > 0) where.programa = programa;

  if (filters.ciudad) {
    where.aspirante = {
      ciudad: { equals: filters.ciudad, mode: 'insensitive' },
    };
  }

  return where;
};

const rangeFromFilters = (filters: DashboardFilterDto) => ({
  start: filters.startDate ? new Date(filters.startDate) : undefined,
  end: filters.endDate ? new Date(filters.endDate) : undefined,
});

/**
 * Ventanas para calcular variaciones: con rango completo se compara contra el
 * período inmediatamente anterior de igual duración; sin rango se comparan los
 * últimos 30 días contra los 30 previos.
 */
const comparisonWindows = (filters: DashboardFilterDto) => {
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    const duration = end.getTime() - start.getTime();
    return {
      tipo: 'periodo_anterior' as const,
      current: { start, end },
      previous: {
        start: new Date(start.getTime() - duration),
        end: new Date(start.getTime() - 1),
      },
    };
  }

  const now = new Date();
  const start = new Date(now.getTime() - 30 * DAY_MS);
  return {
    tipo: 'ultimos_30_dias' as const,
    current: { start, end: now },
    previous: {
      start: new Date(start.getTime() - 30 * DAY_MS),
      end: new Date(start.getTime() - 1),
    },
  };
};

const sumIngresos = (agg: {
  _sum: {
    valorPagoInscripcion: Prisma.Decimal | null;
    valorMatricula: Prisma.Decimal | null;
  };
}) =>
  Number(agg._sum.valorPagoInscripcion || 0) +
  Number(agg._sum.valorMatricula || 0);

/** Métricas que se comparan entre ventanas (solicitudes, conversión, ingresos) */
const windowMetrics = async (where: Prisma.SolicitudWhereInput) => {
  const [total, matriculados, ingresos] = await Promise.all([
    prisma.solicitud.count({ where }),
    prisma.solicitud.count({
      where: { ...where, estado: { in: ESTADOS_MATRICULADOS } },
    }),
    prisma.solicitud.aggregate({
      where,
      _sum: { valorPagoInscripcion: true, valorMatricula: true },
    }),
  ]);
  return {
    total,
    matriculados,
    conversion: pct(matriculados, total),
    ingresos: sumIngresos(ingresos),
  };
};

export const dashboardService = {
  /**
   * KPIs principales del proceso con comparación contra el período anterior
   */
  getKPIs: async (filters: DashboardFilterDto) => {
    const where = buildWhere(filters, rangeFromFilters(filters));
    const windows = comparisonWindows(filters);
    const entrevistaWhere: Prisma.EntrevistaWhereInput = { solicitud: where };

    const [
      totalSolicitudes,
      aspirantes,
      enProceso,
      totalAdmitidos,
      totalRechazados,
      totalMatriculados,
      ingresos,
      icfes,
      procesosCompletos,
      entrevistasRealizadas,
      entrevistasPendientes,
      capellania,
      academica,
      currentWindow,
      previousWindow,
    ] = await Promise.all([
      prisma.solicitud.count({ where }),
      prisma.solicitud.groupBy({ by: ['aspiranteId'], where }),
      prisma.solicitud.count({
        where: { ...where, estado: { notIn: ESTADOS_FINALES } },
      }),
      prisma.solicitud.count({
        where: { ...where, estado: { in: ESTADOS_ADMITIDOS } },
      }),
      prisma.solicitud.count({ where: { ...where, estado: 'RECHAZADO' } }),
      prisma.solicitud.count({
        where: { ...where, estado: { in: ESTADOS_MATRICULADOS } },
      }),
      prisma.solicitud.aggregate({
        where,
        _sum: { valorPagoInscripcion: true, valorMatricula: true },
      }),
      prisma.solicitud.aggregate({
        where: { ...where, puntajeIcfes: { not: null } },
        _avg: { puntajeIcfes: true },
      }),
      prisma.solicitud.findMany({
        where: { ...where, matriculaPagadaEn: { not: null } },
        select: { createdAt: true, matriculaPagadaEn: true },
      }),
      prisma.entrevista.count({
        where: { ...entrevistaWhere, estado: 'COMPLETADA' },
      }),
      prisma.entrevista.count({
        where: {
          ...entrevistaWhere,
          estado: { in: ['PENDIENTE', 'REPROGRAMADA'] },
        },
      }),
      prisma.evaluacionCapellania.aggregate({
        where: { entrevista: entrevistaWhere },
        _avg: { promedio: true },
      }),
      prisma.evaluacionAcademica.aggregate({
        where: { entrevista: entrevistaWhere },
        _avg: { promedio: true },
      }),
      windowMetrics(buildWhere(filters, windows.current)),
      windowMetrics(buildWhere(filters, windows.previous)),
    ]);

    const diasProceso = procesosCompletos.map(
      (s) => (s.matriculaPagadaEn!.getTime() - s.createdAt.getTime()) / DAY_MS,
    );
    const promedioDiasProceso =
      diasProceso.length > 0
        ? round(diasProceso.reduce((a, b) => a + b, 0) / diasProceso.length, 1)
        : null;

    const ingresosInscripcion = Number(ingresos._sum.valorPagoInscripcion || 0);
    const ingresosMatricula = Number(ingresos._sum.valorMatricula || 0);

    return {
      comparacion: windows.tipo,

      totalSolicitudes,
      variacionSolicitudes: variacion(
        currentWindow.total,
        previousWindow.total,
      ),
      totalAspirantes: aspirantes.length,
      enProceso,

      totalAdmitidos,
      totalRechazados,
      // Admitidos sobre el total de solicitudes que ya recibieron decisión
      tasaAdmision: pct(totalAdmitidos, totalAdmitidos + totalRechazados),

      totalMatriculados,
      tasaConversion: pct(totalMatriculados, totalSolicitudes),
      variacionConversion: parseFloat(
        (currentWindow.conversion - previousWindow.conversion).toFixed(2),
      ),

      ingresosInscripcion,
      ingresosMatricula,
      ingresosTotales: ingresosInscripcion + ingresosMatricula,
      variacionIngresos: variacion(
        currentWindow.ingresos,
        previousWindow.ingresos,
      ),

      promedioIcfes: round(icfes._avg.puntajeIcfes, 1),
      promedioDiasProceso,

      entrevistasRealizadas,
      entrevistasPendientes,
      promedioCapellania: round(
        capellania._avg.promedio && Number(capellania._avg.promedio),
      ),
      promedioAcademica: round(
        academica._avg.promedio && Number(academica._avg.promedio),
      ),
    };
  },

  /**
   * Distribución de solicitudes por estado actual
   */
  getFunnel: async (filters: DashboardFilterDto) => {
    const funnelData = await prisma.solicitud.groupBy({
      by: ['estado'],
      _count: { id: true },
      where: buildWhere(filters, rangeFromFilters(filters)),
    });

    // Mapear al orden lógico del BPMN y asegurar que todos los estados aparezcan (incluso con 0)
    return FUNNEL_ORDER.map((estado) => {
      const found = funnelData.find((f) => f.estado === estado);
      return {
        estado,
        cantidad: found?._count.id || 0,
      };
    });
  },

  /**
   * Embudo de conversión acumulado: cuántas solicitudes alcanzaron cada etapa
   */
  getConversion: async (filters: DashboardFilterDto) => {
    const solicitudes = await prisma.solicitud.findMany({
      where: buildWhere(filters, rangeFromFilters(filters)),
      select: {
        estado: true,
        pagoInscripcionEn: true,
        requisitosValidados: true,
        fechaValidacion: true,
        aprobadoPreliminarEn: true,
        matriculaPagadaEn: true,
        cuentaActivadaEn: true,
      },
    });

    const rangos = solicitudes.map((s) =>
      Math.max(
        RANGO_POR_ESTADO[s.estado],
        s.pagoInscripcionEn ? 2 : 0,
        s.requisitosValidados || s.fechaValidacion ? 4 : 0,
        s.aprobadoPreliminarEn ? 5 : 0,
        s.matriculaPagadaEn ? 8 : 0,
        s.cuentaActivadaEn ? 9 : 0,
      ),
    );

    const total = solicitudes.length;
    let anterior = total;
    return ETAPAS_CONVERSION.map((etapa, index) => {
      const cantidad = rangos.filter((r) => r >= index + 1).length;
      const item = {
        etapa,
        cantidad,
        porcentajeTotal: pct(cantidad, total),
        porcentajeEtapaAnterior: pct(cantidad, anterior),
      };
      anterior = cantidad;
      return item;
    });
  },

  /**
   * Alertas en tiempo real para acción inmediata
   */
  getAlerts: async (filters: { rol?: string; programaId?: string }) => {
    const where: Prisma.SolicitudWhereInput = {};
    if (filters.programaId) where.programaId = filters.programaId;

    const now = new Date();
    const entrevistaActiva: Prisma.EntrevistaWhereInput = {
      solicitud: where,
      estado: { in: ['PENDIENTE', 'REPROGRAMADA'] },
    };

    const [
      observadas,
      entrevistasProximaSemana,
      entrevistasVencidas,
      documentosPendientes,
      ratificacionesPendientes,
      solicitudesEstancadas,
      respuestasVencidas,
    ] = await Promise.all([
      prisma.solicitud.count({ where: { ...where, estado: 'OBSERVADO' } }),
      prisma.entrevista.count({
        where: {
          ...entrevistaActiva,
          fechaProgramada: {
            gte: now,
            lte: new Date(now.getTime() + 7 * DAY_MS),
          },
        },
      }),
      prisma.entrevista.count({
        where: { ...entrevistaActiva, fechaProgramada: { lt: now } },
      }),
      // Cargados pero no validados
      prisma.documento.count({
        where: { estado: 'CARGADO', solicitud: where },
      }),
      prisma.decisionAdmision.count({
        where: { estadoRatificacion: 'PENDIENTE', solicitud: where },
      }),
      // Solicitudes activas sin movimiento en los últimos 15 días
      prisma.solicitud.count({
        where: {
          ...where,
          estado: { notIn: ESTADOS_FINALES },
          updatedAt: { lt: new Date(now.getTime() - 15 * DAY_MS) },
        },
      }),
      // Admitidos cuya fecha límite para responder / matricularse ya pasó
      prisma.solicitud.count({
        where: {
          ...where,
          estado: { in: ['ADMITIDO_PRELIMINAR', 'ADMITIDO'] },
          fechaLimiteRespuesta: { lt: now },
        },
      }),
    ]);

    const puedeRatificar =
      !filters.rol ||
      filters.rol === 'VICERRECTORIA' ||
      filters.rol === 'ADMIN';

    return {
      solicitudesObservadas: observadas,
      entrevistasProximaSemana,
      entrevistasVencidas,
      documentosPorValidar: documentosPendientes,
      ratificacionesPendientes: puedeRatificar ? ratificacionesPendientes : 0,
      solicitudesEstancadas,
      respuestasVencidas,
    };
  },

  /**
   * Tendencias históricas para gráficos de línea/área y pronósticos
   */
  getTrends: async (query: TrendsQueryDto) => {
    const { startDate, endDate, groupBy, programaId } = query;

    // groupBy ya viene validado por zod, se interpola como literal para que
    // el SELECT y el GROUP BY usen exactamente la misma expresión
    const dateTrunc = Prisma.raw(`'${groupBy}'`);

    const whereClause: Prisma.Sql[] = [];

    if (startDate) {
      whereClause.push(Prisma.sql`s."created_at" >= ${new Date(startDate)}`);
    }
    if (endDate) {
      whereClause.push(Prisma.sql`s."created_at" <= ${new Date(endDate)}`);
    }
    if (programaId) {
      whereClause.push(Prisma.sql`s."programaId" = ${programaId}`);
    }

    const whereSql =
      whereClause.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(whereClause, ' AND ')}`
        : Prisma.empty;

    const trends = await prisma.$queryRaw<unknown[]>`
      SELECT
        DATE_TRUNC(${dateTrunc}, s."created_at") as period,
        COUNT(s.id)::int as total_solicitudes,
        SUM(CASE WHEN s.estado IN ('ADMITIDO', 'MATRICULADO', 'CUENTA_ACTIVADA') THEN 1 ELSE 0 END)::int as admitidos,
        SUM(CASE WHEN s.estado IN ('MATRICULADO', 'CUENTA_ACTIVADA') THEN 1 ELSE 0 END)::int as matriculados,
        SUM(CASE WHEN s.estado = 'RECHAZADO' THEN 1 ELSE 0 END)::int as rechazados,
        COALESCE(SUM(s."valorMatricula"), 0)::float as ingresos_matricula,
        COALESCE(SUM(s."valorPagoInscripcion"), 0)::float as ingresos_inscripcion
      FROM "solicitudes" s
      ${whereSql}
      GROUP BY period
      ORDER BY period ASC
    `;

    return trends;
  },

  /**
   * Métricas detalladas por Programa Académico (tabla del dashboard y exportación)
   */
  getProgramMetrics: async (filters: DashboardFilterDto) => {
    const where = buildWhere(filters, rangeFromFilters(filters));

    const [porPrograma, porEstado] = await Promise.all([
      prisma.solicitud.groupBy({
        by: ['programaId'],
        _count: { id: true },
        _sum: { valorMatricula: true, valorPagoInscripcion: true },
        _avg: { puntajeIcfes: true },
        where,
      }),
      prisma.solicitud.groupBy({
        by: ['programaId', 'estado'],
        _count: { id: true },
        where,
      }),
    ]);

    const programas = await prisma.programaAcademico.findMany({
      where: { id: { in: porPrograma.map((p) => p.programaId) } },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        facultad: true,
        jornada: true,
      },
    });

    const contar = (programaId: string, estados: EstadoSolicitud[]) =>
      porEstado
        .filter(
          (e) => e.programaId === programaId && estados.includes(e.estado),
        )
        .reduce((acc, e) => acc + e._count.id, 0);

    return porPrograma
      .map((p) => {
        const programa = programas.find((pr) => pr.id === p.programaId);
        const total = p._count.id;
        const matriculados = contar(p.programaId, ESTADOS_MATRICULADOS);
        return {
          programaId: p.programaId,
          nombre: programa?.nombre ?? 'Programa desconocido',
          codigo: programa?.codigo ?? '',
          facultad: programa?.facultad ?? null,
          jornada: programa?.jornada ?? null,
          totalSolicitudes: total,
          enProceso: total - contar(p.programaId, ESTADOS_FINALES),
          admitidos: contar(p.programaId, ESTADOS_ADMITIDOS),
          matriculados,
          rechazados: contar(p.programaId, ['RECHAZADO']),
          tasaConversion: pct(matriculados, total),
          promedioIcfes: round(p._avg.puntajeIcfes, 1),
          ingresos: sumIngresos(p),
        };
      })
      .sort((a, b) => b.totalSolicitudes - a.totalSolicitudes);
  },

  /**
   * Actividad reciente: últimas solicitudes y próximas entrevistas
   */
  getActivity: async (query: ActivityQueryDto) => {
    const where = buildWhere(query, rangeFromFilters(query));

    const [solicitudesRecientes, proximasEntrevistas] = await Promise.all([
      prisma.solicitud.findMany({
        where,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          codigo: true,
          estado: true,
          createdAt: true,
          aspirante: { select: { nombres: true, apellidos: true } },
          programa: { select: { nombre: true } },
        },
      }),
      prisma.entrevista.findMany({
        where: {
          solicitud: where,
          estado: { in: ['PENDIENTE', 'REPROGRAMADA'] },
          fechaProgramada: { gte: new Date() },
        },
        take: query.limit,
        orderBy: { fechaProgramada: 'asc' },
        select: {
          id: true,
          tipo: true,
          estado: true,
          fechaProgramada: true,
          modalidad: true,
          solicitud: {
            select: {
              codigo: true,
              aspirante: { select: { nombres: true, apellidos: true } },
            },
          },
          evaluador: { select: { nombres: true, apellidos: true } },
        },
      }),
    ]);

    return { solicitudesRecientes, proximasEntrevistas };
  },
};
