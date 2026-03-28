import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';



import router from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import AppError from './utils/AppError.js';
import logger from './utils/logger.js';


const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
    connectSrc: [
      "'self'",
      "http://localhost:5173",
      "http://localhost:5002"
    ],
  },
},
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  })
);

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Data Sanitisation ────────────────────────────────────────────────────────
app.use(mongoSanitize()); // NoSQL injection protection

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: (req) => req.url === '/api/v1/health',
    })
  );
}

// ─── Trust Proxy (for rate limiter behind nginx/load balancer) ────────────────
app.set('trust proxy', 1);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'productivity-api',
    message: 'API is running.',
    docs: '/api/v1',
    health: '/api/v1/health',
  });
});

app.get('/health', (req, res) => {
  res.redirect(302, '/api/v1/health');
});

app.use('/api/v1', router);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
