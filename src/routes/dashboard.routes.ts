import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
// import { authenticate, authorize } from '../middlewares/auth.middleware'; // Descomenta cuando lo integres

export const dashboardRoutes = Router();

// Aplicar middleware de autenticación a todas las rutas del dashboard
// dashboardRoutes.use(authenticate);

dashboardRoutes.get('/kpis', dashboardController.getKPIs);
dashboardRoutes.get('/funnel', dashboardController.getFunnel);
dashboardRoutes.get('/conversion', dashboardController.getConversion);
dashboardRoutes.get('/programas', dashboardController.getProgramas);
dashboardRoutes.get('/actividad', dashboardController.getActivity);
dashboardRoutes.get('/alerts', dashboardController.getAlerts);
dashboardRoutes.get('/trends', dashboardController.getTrends);
dashboardRoutes.get('/export', dashboardController.getExportData);
