import express from 'express';
import { programaRoutes } from './routes/programa.routes'; // <-- Agregar esto

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor de Admisiones corriendo' });
});

// Registrar rutas de la API
app.use('/api/programas', programaRoutes); // <-- Agregar esto
