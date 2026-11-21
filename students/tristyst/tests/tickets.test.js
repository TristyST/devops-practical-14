
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'tickets.json');
const SERVER_FILE = path.join(__dirname, '..', 'src', 'server.js');

const PORT = 3101;
const API_URL = `http://127.0.0.1:${PORT}`;

let server;
let serverOutput = '';

before(async () => {
    server = spawn(process.execPath, [SERVER_FILE], {
        env: {
            ...process.env,
            PORT: String(PORT)
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    server.stdout.on('data', data => {
        serverOutput += data.toString();
    });

    server.stderr.on('data', data => {
        serverOutput += data.toString();
    });

    let ready = false;

    for (let attempt = 0; attempt < 50; attempt++) {
        if (server.exitCode !== null) {
            break;
        }

        try {
            const response = await fetch(`${API_URL}/health`);

            if (response.ok) {
                ready = true;
                break;
            }
        } catch {
            // Server is still starting.
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!ready) {
        server.kill();

        throw new Error(
            `API server did not start.\n${serverOutput}`
        );
    }
});

after(() => {
    if (server && server.exitCode === null) {
        server.kill();
    }
});

test('Campus Helpdesk API', async (t) => {
    await t.test('GET /health returns status ok', async () => {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();

        assert.equal(response.status, 200);
        assert.equal(data.status, 'ok');
    });

    await t.test('POST creates a ticket', async () => {
        const response = await fetch(`${API_URL}/api/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Test ticket',
                description: 'Automated test description',
                category: 'testing',
                priority: 'medium'
            })
        });

        const data = await response.json();

        assert.equal(response.status, 201);
        assert.equal(data.ticket.title, 'Test ticket');
        assert.equal(data.ticket.status, 'open');
    });

    await t.test('GET returns created tickets', async () => {
        const response = await fetch(`${API_URL}/api/tickets`);
        const data = await response.json();

        assert.equal(response.status, 200);
        assert.ok(
            data.tickets.some(ticket => ticket.title === 'Test ticket')
        );
    });

    await t.test('PATCH updates ticket status', async () => {
        const tickets = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const ticket = tickets.find(item => item.title === 'Test ticket');

        assert.ok(ticket, 'Test ticket should exist');

        const response = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'resolved' })
        });

        const data = await response.json();

        assert.equal(response.status, 200);
        assert.equal(data.ticket.status, 'resolved');
    });

    await t.test('DELETE removes ticket', async () => {
        const tickets = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const ticket = tickets.find(item => item.title === 'Test ticket');

        assert.ok(ticket, 'Test ticket should exist');

        const response = await fetch(`${API_URL}/api/tickets/${ticket.id}`);
        assert.equal(response.status, 200);

        const deleteResponse = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
            method: 'DELETE'
        });

        assert.equal(deleteResponse.status, 200);

        const checkResponse = await fetch(`${API_URL}/api/tickets/${ticket.id}`);
        assert.equal(checkResponse.status, 404);
    });
});
