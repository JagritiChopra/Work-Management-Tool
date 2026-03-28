import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/database.js';
import logger from './utils/logger.js';
import dns from "dns" ;
// ─── Uncaught Exception Guard (must be first) ─────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', { error: err.message, stack: err.stack });
  process.exit(1);
});
dns.setServers(['1.1.1.1']);
// ─── Connect DB then Start ────────────────────────────────────────────────────
await connectDB();

const PORT = parseInt(process.env.PORT, 10) || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', { error: err.message, stack: err.stack });
  shutdown('unhandledRejection');
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
