-- Autenticación: contraseña y último acceso de los usuarios internos
ALTER TABLE "usuarios" ADD COLUMN "password_hash" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "ultimo_acceso" TIMESTAMP(3);
