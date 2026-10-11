import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'; // <-- 1. Importar cors
import { programaRoutes } from './routes/programa.routes';
import { aspiranteRoutes } from './routes/aspirante.routes';
import { usuarioRoutes } from './routes/usuario.routes';
import { entrevistaRoutes } from './routes/entrevista.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { solicitudRoutes } from './routes/solicitud.routes';
import { chatRoutes } from './routes/chat.routes';
import { documentoRoutes } from './routes/documento.routes';
import { decisionRoutes } from './routes/decision.routes';
import { observacionRoutes } from './routes/observacion.routes';
import { authRoutes } from './routes/auth.routes';
import { publicRoutes } from './routes/public.routes';
import { requireAuth } from './middlewares/auth.middleware';
export const app = express();

// 2. Configurar CORS (¡DEBE IR ANTES de express.json() y de las rutas!)
app.use(
  cors({
    origin: 'http://localhost:5173', // El puerto de tu frontend (Vite)
    credentials: true, // Permite enviar cookies/credenciales si las usas
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// 3. Middlewares de parseo de datos
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// 4. Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Servidor de Admisiones corriendo' });
});

// 5. Rutas de la API
// Públicas: sesión, landing (programas, chat y pre-inscripción)
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/programas', programaRoutes); // GET público, escritura protegida dentro del router

// Panel administrativo: requieren sesión (y rol según la acción)
app.use('/aspirantes', requireAuth, aspiranteRoutes);
app.use('/api/usuarios', requireAuth, usuarioRoutes);
app.use('/api/entrevistas', requireAuth, entrevistaRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/solicitudes', requireAuth, solicitudRoutes);
app.use('/api/documentos', requireAuth, documentoRoutes);
app.use('/api/decisiones', requireAuth, decisionRoutes);
app.use('/api/observaciones', requireAuth, observacionRoutes);

// ⚠️ NOTA: Fíjate que aquí puse '/api/programas'.
// Si tu frontend llama a 'http://localhost:3000/programas' (sin /api),
// cambia esta línea a: app.use('/programas', programaRoutes);

// 6. Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});
