const express = require('express');
const next = require('next');
const http = require('http');
const WebSocket = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const wss = new WebSocket.Server({ server: httpServer });

  // WebSocket server for chat
  wss.on('connection', ws => {
    console.log('Client connected');
    ws.on('message', message => {
      console.log(`Received: ${message}`);
      // Simple echo for now, replace with OpenClaw integration
      ws.send(`Echo: ${message}`);
    });
    ws.on('close', () => console.log('Client disconnected'));
  });

  // Next.js request handling
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
