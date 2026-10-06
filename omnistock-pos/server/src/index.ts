import 'dotenv/config';
import express from 'express';
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

// Dynamic CORS Configuration (Strict Zero Trust - no wildcard reflection with credentials)
const rawOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = (rawOrigins && rawOrigins.length > 0) 
  ? rawOrigins 
  : ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:8080'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin header Origin (mismo origen Nginx o curl/mobile) o verificar origen permitido
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Blocked by Zero Trust CORS Policy: ${origin}`));
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

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

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

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`); // Dashboard Active
  await initSqlite();
});
