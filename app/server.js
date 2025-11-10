/**
 * Custom Next.js Server with Socket.io
 * 
 * This server initializes Socket.io alongside Next.js for real-time notifications.
 * 
 * Usage:
 *   Development: npm run dev
 *   Production: npm run start
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Initialize Socket.io server
let initializeSocketServer;
try {
  const socketModule = require('./lib/realtime/socketServer');
  initializeSocketServer = socketModule.initializeSocketServer;
} catch (error) {
  console.warn('[Server] Socket.io server module not found, running without real-time notifications');
  initializeSocketServer = null;
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io server if available
  if (initializeSocketServer) {
    try {
      initializeSocketServer(server);
      console.log('[Server] Socket.io server initialized');
    } catch (error) {
      console.error('[Server] Failed to initialize Socket.io server:', error);
      console.warn('[Server] Continuing without real-time notifications');
    }
  }

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    if (initializeSocketServer) {
      console.log('> Socket.io server running on /socket.io');
    }
  });
});

