process.on('uncaughtException', (err) => {
  console.error('FATAL UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('FATAL UNHANDLED REJECTION:', reason);
});

console.log('🚀 Initializing KasirPro backend server...');
const express = require('express');
const cors = require('cors');

try {
  require('dotenv').config({ quiet: true });
} catch (_) {}

const app = express();
const PORT = process.env.PORT || 5000;

// Health checks FIRST for instant container health checks
app.get('/', (req, res) => res.status(200).send('KasirPro API is running'));
app.get('/health', (req, res) => res.status(200).json({ status: 'healthy' }));

// Start listening immediately so Back4App health checks pass with 0ms delay
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server berjalan di http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health\n`);
});

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://cashier-me.netlify.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.netlify.app') ||
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load routes & database
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/transactions', require('./routes/transactions'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  console.log('✅ All routes loaded successfully');
} catch (routeErr) {
  console.error('❌ Error loading routes:', routeErr);
}

// Detailed Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message });
});
