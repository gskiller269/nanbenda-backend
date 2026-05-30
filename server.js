require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');

// Route imports
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const salesRoutes = require('./src/routes/sales');
const rechargeRoutes = require('./src/routes/recharges');
const emiRoutes = require('./src/routes/emis');
const employeeRoutes = require('./src/routes/employees');
const networkRoutes = require('./src/routes/networks');
const simStockRoutes = require('./src/routes/simstock');
const walletRoutes = require('./src/routes/wallet');
const serviceRoutes = require('./src/routes/services');
const simSalesRoutes = require('./src/routes/sim_sales');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────

// CORS — allow all origins in development
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compress all responses
app.use(compression());

// Parse JSON bodies
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    const ts = new Date().toISOString();
    res.on('finish', () => {
        console.log(`[${ts}] ${req.method} ${req.path} ➜ ${res.statusCode}`);
    });
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
app.use('/api/wallet', walletRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/sim_sales', simSalesRoutes);

// ─── Debug Route ─────────────────────────────────────────────────────────────
app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push(Object.keys(middleware.route.methods)[0].toUpperCase() + ' ' + middleware.route.path);
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                const route = handler.route;
                if (route) {
                    const methods = Object.keys(route.methods).join(', ').toUpperCase();
                    routes.push(`${methods} /api` + middleware.regexp.source.replace('^\\/api\\/', '/').split('?')[0].replace(/\\\//g, '/') + route.path);
                }
            });
        }
    });
    res.json({ registered_routes: routes });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
    const ts = new Date().toISOString();
    console.error(`[${ts}] ❌ Global Error [${req.method} ${req.path}]:`, err.message || err);
    if (err.stack) console.error(err.stack);
    
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

process.on('uncaughtException', (err) => {
    console.error('[Fatal] Uncaught Exception:', err);
    // Give it a moment to log before exiting
    setTimeout(() => process.exit(1), 100);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
// Bind to 0.0.0.0 so the server is reachable from ANY network interface
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 NANDAMART BACKEND STARTED');
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Port: ${PORT}`);
    console.log(`📡 Local: http://localhost:${PORT}`);
    console.log(`🧬 Health: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50) + '\n');
});

