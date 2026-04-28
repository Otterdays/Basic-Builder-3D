// [TRACE: ARCHITECTURE.md] — Local API client (talks to localhost:3000)
// All requests go to the same origin — no external services.

const API_BASE = '/api';

class BuilderApi {
    async _request(method, path, body) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body !== undefined) opts.body = JSON.stringify(body);
        const res = await fetch(`${API_BASE}${path}`, opts);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `API error ${res.status}`);
        return json;
    }

    // ── Health ──────────────────────────────────────────────────
    health() {
        return this._request('GET', '/health');
    }

    // ── Projects ────────────────────────────────────────────────
    listProjects() {
        return this._request('GET', '/projects');
    }
    createProject(name, description = '') {
        return this._request('POST', '/projects', { name, description });
    }
    updateProject(id, name, description) {
        return this._request('PUT', `/projects/${id}`, { name, description });
    }
    deleteProject(id) {
        return this._request('DELETE', `/projects/${id}`);
    }

    // ── Blueprints ──────────────────────────────────────────────
    listBlueprints(projectId) {
        return this._request('GET', `/projects/${projectId}/blueprints`);
    }
    saveBlueprint(projectId, name, data, thumbnail = null) {
        return this._request('POST', `/projects/${projectId}/blueprints`, { name, data, thumbnail });
    }
    getBlueprint(id) {
        return this._request('GET', `/blueprints/${id}`);
    }
    updateBlueprint(id, payload) {
        return this._request('PUT', `/blueprints/${id}`, payload);
    }
    deleteBlueprint(id) {
        return this._request('DELETE', `/blueprints/${id}`);
    }

    // ── Gallery ─────────────────────────────────────────────────
    gallery() {
        return this._request('GET', '/gallery');
    }

    // ── History ─────────────────────────────────────────────────
    getHistory(blueprintId) {
        return this._request('GET', `/blueprints/${blueprintId}/history`);
    }
    getHistoryEntry(blueprintId, historyId) {
        return this._request('GET', `/blueprints/${blueprintId}/history/${historyId}`);
    }
    restoreHistoryEntry(blueprintId, historyId) {
        return this._request('POST', `/blueprints/${blueprintId}/restore/${historyId}`);
    }
}

export const api = new BuilderApi();
