const express = require('express');
const router = express.Router();
const { getDb, saveDb, generateId } = require('../db');

router.get('/', (req, res) => {
    try {
        const db = getDb();
        const rows = db.projects.map(p => {
            const count = db.blueprints.filter(b => b.project_id === p.id).length;
            return { ...p, blueprint_count: count };
        });
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to list projects' });
    }
});

router.post('/', (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
        
        const db = getDb();
        const project = {
            id: generateId(),
            name: name.trim(),
            description: (description || '').trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db.projects.push(project);
        saveDb();
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

router.delete('/:id', (req, res) => {
    try {
        const db = getDb();
        const id = parseInt(req.params.id);
        db.projects = db.projects.filter(p => p.id !== id);
        db.blueprints = db.blueprints.filter(b => b.project_id !== id);
        saveDb();
        res.json({ deleted: true, id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

module.exports = router;
