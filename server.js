require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Route imports
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const salesRoutes = require('./src/routes/sales');
const rechargeRoutes = require('./src/routes/recharges');
const emiRoutes = require('./src/routes/emis');
const employeeRoutes = require('./src/routes/employees');
const networkRoutes = require('./src/routes/networks');
const simStockRoutes = require('./src/routes/simstock');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────

// CORS — allow all origins in development
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.path}`);
    next();
});

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'Nandamart Backend',
        timestamp: new Date().toISOString(),
    });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/recharges', rechargeRoutes);
app.use('/api/emis', emiRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/networks', networkRoutes);
app.use('/api/simstock', simStockRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Server Error]', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
// Bind to 0.0.0.0 so the server is reachable from ANY network interface
// (LAN, WiFi, and via tunneling tools like ngrok for mobile data access)
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  ✅  Nandamart Backend is running!');
    console.log(`  🌐  Local:   http://localhost:${PORT}`);
    console.log(`  🌐  Network: http://0.0.0.0:${PORT}`);
    console.log(`  📡  Health:  http://localhost:${PORT}/api/health`);
    console.log('');
});
