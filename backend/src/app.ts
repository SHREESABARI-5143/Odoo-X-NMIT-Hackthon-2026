import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import privateInfoRoutes from './routes/privateInfo.routes';
import securityInfoRoutes from './routes/securityInfo.routes';
import documentRoutes from './routes/document.routes';
import skillRoutes from './routes/skill.routes';
import certificationRoutes from './routes/certification.routes';
import uploadRoutes from './routes/upload.routes';
import companyRoutes from './routes/company.routes';
import { authenticate } from './middleware/authenticate';
import { SkillController, CertificationController } from './controllers/skill.controller';

const app = express();

// ─── Security & Parsing ─────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Request Logging ─────────────────────────────────────
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ─── Serve uploaded files (behind /uploads path, not raw filesystem) ───
app.use('/uploads', express.static(path.resolve(config.uploadBasePath)));

// ─── Health Check ────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/employees/:id/private-info', privateInfoRoutes);
app.use('/employees/:id/security', securityInfoRoutes);
app.use('/employees/:id/documents', documentRoutes);
app.use('/skills', skillRoutes);
app.use('/certifications', certificationRoutes);
app.use('/upload', uploadRoutes);
app.use('/company', companyRoutes);

// Sub-routes: GET /employees/:id/skills and /employees/:id/certifications
app.get('/employees/:id/skills', authenticate, SkillController.getByEmployee);
app.get('/employees/:id/certifications', authenticate, CertificationController.getByEmployee);

// ─── 404 Handler ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found.',
  });
});

// ─── Global Error Handler (MUST be last) ─────────────────
app.use(errorHandler);

export default app;
