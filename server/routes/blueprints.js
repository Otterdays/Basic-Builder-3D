const express = require('express');
const router = express.Router();
const { getDb, saveDb, generateId } = require('../db');

// GET /api/projects/:pid/blueprints — list blueprints in a project
router.get('/projects/:pid/blueprints', (req, res) => {
    try {
        const db = getDb();
        const pid = parseInt(req.params.pid);
        const rows = db.blueprints
            .filter(b => b.project_id === pid)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .map(({ data, ...rest }) => rest); // exclude full data for list
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to list' });
    }
});

// POST /api/projects/:pid/blueprints — save new blueprint
router.post('/projects/:pid/blueprints', (req, res) => {
    try {
        const { name, data, thumbnail } = req.body;
        const pid = parseInt(req.params.pid);
        if (!name || !data) return res.status(400).json({ error: 'Name and data required' });

        const db = getDb();
        const project = db.projects.find(p => p.id === pid);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const partCount = Array.isArray(parsed.parts) ? parsed.parts.length : 0;

        const bp = {
            id: generateId(),
            project_id: pid,
            name: name.trim(),
            version: 1,
            part_count: partCount,
            data: typeof data === 'string' ? data : JSON.stringify(data),
            thumbnail: thumbnail || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.blueprints.push(bp);
        project.updated_at = new Date().toISOString();
        saveDb();
        res.status(201).json(bp);
    } catch (err) {
        res.status(500).json({ error: 'Save failed' });
    }
});

// GET /api/blueprints/:id — get full blueprint
router.get('/blueprints/:id', (req, res) => {
    try {
        const db = getDb();
        const id = parseInt(req.params.id);
        const bp = db.blueprints.find(b => b.id === id);
        if (!bp) return res.status(404).json({ error: 'Not found' });
        res.json(bp);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get' });
    }
});

// PUT /api/blueprints/:id — update blueprint (auto-versions)
router.put('/blueprints/:id', (req, res) => {
    try {
        const { name, data, thumbnail } = req.body;
        const db = getDb();
        const id = parseInt(req.params.id);
        const existing = db.blueprints.find(b => b.id === id);
        if (!existing) return res.status(404).json({ error: 'Not found' });

        // Archive version
        db.history.push({
            id: generateId(),
            blueprint_id: existing.id,
            version: existing.version,
            part_count: existing.part_count,
            data: existing.data,
            saved_at: new Date().toISOString()
        });

        if (name) existing.name = name.trim();
        if (data) {
            existing.data = typeof data === 'string' ? data : JSON.stringify(data);
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            existing.part_count = Array.isArray(parsed.parts) ? parsed.parts.length : 0;
        }
        if (thumbnail !== undefined) existing.thumbnail = thumbnail;
        
        existing.version++;
        existing.updated_at = new Date().toISOString();
        
        const proj = db.projects.find(p => p.id === existing.project_id);
        if (proj) proj.updated_at = new Date().toISOString();

        saveDb();
        res.json(existing);
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// GET /api/gallery — all blueprints with project names
router.get('/gallery', (req, res) => {
    try {
        const db = getDb();
        const rows = db.blueprints
            .map(b => {
                const p = db.projects.find(proj => proj.id === b.project_id);
                return { ...b, project_name: p ? p.name : 'Unknown' };
            })
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .map(({ data, ...rest }) => rest);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Gallery failed' });
    }
});

module.exports = router;
