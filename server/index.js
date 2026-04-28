// [TRACE: ARCHITECTURE.md] — Express server entry point
const express = require('express');
const path = require('path');
const { getDb, closeDb } = require('./db');
const projectRoutes = require('./routes/projects');
const blueprintRoutes = require('./routes/blueprints');

const PORT = process.env.PORT || 3000;
const app = express();

// ── Middleware ──────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));

// CORS for dev flexibility
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Request logging
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        const start = Date.now();
        res.on('finish', () => {
            const ms = Date.now() - start;
            console.log(`[api] ${req.method} ${req.url} → ${res.statusCode} (${ms}ms)`);
        });
    }
    next();
});

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/projects', projectRoutes);
app.use('/api', blueprintRoutes);

// Health check
app.get('/api/health', (req, res) => {
    try {
        const db = getDb();
        res.json({
            status: 'ok',
            serverTime: new Date().toISOString(),
            projects: db.projects.length,
            blueprints: db.blueprints.length
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ── Static frontend ────────────────────────────────────────────
const ROOT = path.join(__dirname, '..');
app.use(express.static(ROOT, {
    index: 'index.html',
    extensions: ['html']
}));

// SPA fallback
app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(ROOT, 'index.html'));
});

// ── Start ──────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
    // Initialize DB on startup
    getDb();
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║   3D BUILDER — Backend Server            ║');
    console.log(`  ║   http://localhost:${PORT}                  ║`);
    console.log('  ║                                          ║');
    console.log('  ║   API:  /api/health                      ║');
    console.log('  ║         /api/projects                    ║');
    console.log('  ║         /api/gallery                     ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
});

// Graceful shutdown
function shutdown() {
    console.log('\n[server] shutting down...');
    closeDb();
    server.close(() => {
        console.log('[server] closed.');
        process.exit(0);
    });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
