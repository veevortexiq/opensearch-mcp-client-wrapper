const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security and optimization middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://opensearch-mcp-client.lemoncliff-b4be1984.westus.azurecontainerapps.io"]
    }
  }
}));
app.use(compression());
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create API proxy to avoid CORS issues
app.use('/api/query', createProxyMiddleware({
  target: 'https://opensearch-mcp-client.lemoncliff-b4be1984.westus.azurecontainerapps.io',
  changeOrigin: true,
  pathRewrite: {
    '^/api/query': '/api/query'  // No rewrite needed in this case
  },
  onProxyRes: (proxyRes, req, res) => {
    // Ensure correct headers for streaming responses
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/event-stream')) {
      proxyRes.headers['Cache-Control'] = 'no-cache';
      proxyRes.headers['Connection'] = 'keep-alive';
    }
  }
}));

// Main route to serve the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});