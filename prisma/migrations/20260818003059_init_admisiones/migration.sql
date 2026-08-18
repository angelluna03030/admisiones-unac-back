-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('FORMULARIO_COMPLETADO', 'PAGO_INSCRIPCION', 'DOCUMENTOS_CARGADOS', 'VALIDACION_REQUISITOS', 'OBSERVADO', 'ADMITIDO_PRELIMINAR', 'EN_ENTREVISTA_CAPELLANIA', 'EN_ENTREVISTA_ACADEMICA', 'CORRECCION_PERFIL', 'EN_RATIFICACION', 'ADMITIDO', 'RECHAZADO', 'MATRICULADO', 'CUENTA_ACTIVADA', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DOCUMENTO_IDENTIDAD', 'FOTO', 'CERTIFICADO_BACHILLER', 'RESULTADO_ICFES', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('PENDIENTE', 'CARGADO', 'VALIDADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMISIONES', 'CAPELLAN', 'COORDINADOR_PROGRAMA', 'VICERRECTORIA', 'OFICINA_FINANCIERA', 'REGISTRO_ACADEMICO', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoEntrevista" AS ENUM ('CAPELLANIA', 'ACADEMICA');

-- CreateEnum
CREATE TYPE "EstadoEntrevista" AS ENUM ('PENDIENTE', 'REPROGRAMADA', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoDecision" AS ENUM ('NOTIFICAR_ADMISION', 'SOLICITAR_CORRECCION_PERFIL', 'RECHAZAR');

-- CreateEnum
CREATE TYPE "EstadoRatificacion" AS ENUM ('PENDIENTE', 'RATIFICADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "aspirantes" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "direccion" TEXT,
    "ciudad" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aspirantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas_academicos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "facultad" TEXT,
    "jornada" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "programas_academicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "aspiranteId" TEXT NOT NULL,
    "programaId" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'FORMULARIO_COMPLETADO',
    "formularioCompletadoEn" TIMESTAMP(3),
    "pagoInscripcionEn" TIMESTAMP(3),
    "valorPagoInscripcion" DECIMAL(10,2),
    "bachillerValidado" BOOLEAN NOT NULL DEFAULT false,
    "puntajeIcfes" INTEGER,
    "icfesValidado" BOOLEAN NOT NULL DEFAULT false,
    "requisitosValidados" BOOLEAN NOT NULL DEFAULT false,
    "fechaValidacion" TIMESTAMP(3),
    "validadoPorId" TEXT,
    "aprobadoPreliminarEn" TIMESTAMP(3),
    "fechaLimiteRespuesta" TIMESTAMP(3),
    "matriculaPagadaEn" TIMESTAMP(3),
    "valorMatricula" DECIMAL(10,2),
    "cuentaActivadaEn" TIMESTAMP(3),
    "codigoEstudiante" TEXT,
    "archivadoEn" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'PENDIENTE',
    "urlArchivo" TEXT,
    "observacion" TEXT,
    "cargadoEn" TIMESTAMP(3),
    "validadoEn" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observaciones_admisiones" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "detalle" TEXT,
    "resuelta" BOOLEAN NOT NULL DEFAULT false,
    "emitidaPorId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observaciones_admisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrevistas" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "tipo" "TipoEntrevista" NOT NULL,
    "estado" "EstadoEntrevista" NOT NULL DEFAULT 'PENDIENTE',
    "evaluadorId" TEXT,
    "fechaProgramada" TIMESTAMP(3),
    "fechaRealizada" TIMESTAMP(3),
    "modalidad" TEXT,
    "lugarOEnlace" TEXT,
    "motivoReprogramacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entrevistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones_capellania" (
    "id" TEXT NOT NULL,
    "entrevistaId" TEXT NOT NULL,
    "valoresPrincipiosEticos" INTEGER NOT NULL,
    "proyectoDeVida" INTEGER NOT NULL,
    "convivenciaComunitaria" INTEGER NOT NULL,
    "compromisoReglamento" INTEGER NOT NULL,
    "actitudDisposicion" INTEGER NOT NULL,
    "promedio" DECIMAL(3,2) NOT NULL,
    "observaciones" TEXT,
    "evaluadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_capellania_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones_academicas" (
    "id" TEXT NOT NULL,
    "entrevistaId" TEXT NOT NULL,
    "aptitudAcademica" INTEGER NOT NULL,
    "perfilParaElPrograma" INTEGER NOT NULL,
    "habilidadesComunicacion" INTEGER NOT NULL,
    "pensamientoCritico" INTEGER NOT NULL,
    "motivacionIntrinseca" INTEGER NOT NULL,
    "promedio" DECIMAL(3,2) NOT NULL,
    "conceptoAcademico" TEXT,
    "recomendacionFinal" TEXT,
    "evaluadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_academicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisiones_admision" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "tipo" "TipoDecision" NOT NULL,
    "tomadaPorId" TEXT NOT NULL,
    "tomadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "justificacion" TEXT,
    "estadoRatificacion" "EstadoRatificacion" NOT NULL DEFAULT 'PENDIENTE',
    "ratificadaPorId" TEXT,
    "ratificadaEn" TIMESTAMP(3),
    "comentarioRatificacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decisiones_admision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aspirantes_numeroDocumento_key" ON "aspirantes"("numeroDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "aspirantes_correo_key" ON "aspirantes"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "programas_academicos_codigo_key" ON "programas_academicos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_codigo_key" ON "solicitudes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_codigoEstudiante_key" ON "solicitudes"("codigoEstudiante");

-- CreateIndex
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_solicitudId_tipo_key" ON "documentos"("solicitudId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "entrevistas_solicitudId_tipo_idx" ON "entrevistas"("solicitudId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "evaluaciones_capellania_entrevistaId_key" ON "evaluaciones_capellania"("entrevistaId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluaciones_academicas_entrevistaId_key" ON "evaluaciones_academicas"("entrevistaId");

-- CreateIndex
CREATE INDEX "decisiones_admision_solicitudId_idx" ON "decisiones_admision"("solicitudId");

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_aspiranteId_fkey" FOREIGN KEY ("aspiranteId") REFERENCES "aspirantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas_academicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observaciones_admisiones" ADD CONSTRAINT "observaciones_admisiones_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observaciones_admisiones" ADD CONSTRAINT "observaciones_admisiones_emitidaPorId_fkey" FOREIGN KEY ("emitidaPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_evaluadorId_fkey" FOREIGN KEY ("evaluadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_capellania" ADD CONSTRAINT "evaluaciones_capellania_entrevistaId_fkey" FOREIGN KEY ("entrevistaId") REFERENCES "entrevistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_academicas" ADD CONSTRAINT "evaluaciones_academicas_entrevistaId_fkey" FOREIGN KEY ("entrevistaId") REFERENCES "entrevistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisiones_admision" ADD CONSTRAINT "decisiones_admision_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisiones_admision" ADD CONSTRAINT "decisiones_admision_tomadaPorId_fkey" FOREIGN KEY ("tomadaPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisiones_admision" ADD CONSTRAINT "decisiones_admision_ratificadaPorId_fkey" FOREIGN KEY ("ratificadaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
