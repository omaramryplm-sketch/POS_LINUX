import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import ventasRoutes from './routes/ventas.routes.js';
import comprasRoutes from './routes/compras.routes.js';
import sugerenciasRoutes from './routes/sugerencias.routes.js';
import adminRoutes from './routes/admin.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import usersRoutes from './routes/users.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import { initSqlite } from './lib/prisma.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// Dynamic CORS Configuration (Strict Zero Trust - supports Cloudflare tunnels, nip.io, LAN and custom origins)
const rawOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = (rawOrigins && rawOrigins.length > 0) 
  ? rawOrigins 
  : ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:8080'];

const isAllowedOrigin = (origin: string): boolean => {
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname;
    // Permitir túneles de Cloudflare (*.trycloudflare.com)
    if (hostname.endsWith('.trycloudflare.com')) return true;
    // Permitir subdominios de nip.io
    if (hostname.endsWith('.nip.io')) return true;
    // Permitir localhost e IPs privadas LAN
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname)) return true;
  } catch {
    return false;
  }
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin header Origin (mismo origen Nginx o curl/mobile) o verificar origen permitido
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Anti-DoS: Payload limit

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { status: 429, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  message: { status: 429, message: 'Too many failed login attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const heavyOpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 429, message: 'Too many resource-intensive requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/admin/scrape', heavyOpLimiter);
app.use('/api/admin/export/backup', heavyOpLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/sugerencias', sugerenciasRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/clientes', clientesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'OmniStock POS API is running' });
});

// Global Error Handler (Uniform JSON responses, prevents internal stack leak)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    status: 'error',
    code: err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
    message: status === 500 ? 'Internal server error' : err.message
  });
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`); // Dashboard Active
  await initSqlite();
});
