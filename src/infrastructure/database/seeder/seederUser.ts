/**
 * Crea (o actualiza) el usuario administrador inicial con la contraseña del .env.
 * Uso: bun run db:seederuser
 * Variables: ADMIN_CORREO, ADMIN_PASSWORD, ADMIN_NOMBRES (opcional), ADMIN_APELLIDOS (opcional)
 */
import { prisma } from '../../../db/prisma.service';
import { hashPassword } from '../../../models/auth.service';
import { passwordSchema } from '../../../domain/auth/auth.schema';

const correo = process.env.ADMIN_CORREO?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!correo || !password) {
  console.error('Define ADMIN_CORREO y ADMIN_PASSWORD en el .env');
  process.exit(1);
}

const validacion = passwordSchema.safeParse(password);
if (!validacion.success) {
  console.error(
    `ADMIN_PASSWORD no es válida: ${validacion.error.issues[0]?.message}`,
  );
  process.exit(1);
}

const passwordHash = await hashPassword(password);
const usuario = await prisma.usuario.upsert({
  where: { correo },
  update: { passwordHash, rol: 'ADMIN', activo: true },
  create: {
    correo,
    nombres: process.env.ADMIN_NOMBRES || 'Administrador',
    apellidos: process.env.ADMIN_APELLIDOS || 'del Sistema',
    rol: 'ADMIN',
    activo: true,
    passwordHash,
  },
});

console.log(`✅ Administrador listo: ${usuario.correo}`);
process.exit(0);
