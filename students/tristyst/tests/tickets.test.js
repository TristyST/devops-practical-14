
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'tickets.json');
const API_URL = 'http://localhost:3000';

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
        assert.ok(data.count > 0);
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
