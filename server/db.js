const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const INITIAL_DATA = {
    projects: [
        {
            id: 1,
            name: "My Builds",
            description: "Default local project",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ],
    blueprints: [],
    history: [],
    _nextId: 2
};

let _data = null;

function getDb() {
    if (_data) return _data;

    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2));
        _data = INITIAL_DATA;
    } else {
        try {
            _data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        } catch (e) {
            console.error('[db] Corrupt JSON, resetting to initial');
            _data = INITIAL_DATA;
        }
    }
    return _data;
}

function saveDb() {
    if (!_data) return;
    fs.writeFileSync(DB_PATH, JSON.stringify(_data, null, 2));
}

function generateId() {
    const db = getDb();
    return db._nextId++;
}

module.exports = { getDb, saveDb, generateId };
