
const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const router = express.Router();

const DATA_FILE = path.join(__dirname, 'data', 'tickets.json');

const VALID_STATUSES = ['open', 'in_progress', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

function readTickets() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
            fs.writeFileSync(DATA_FILE, '[]', 'utf8');
            return [];
        }

        throw error;
    }
}

function saveTickets(tickets) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tickets, null, 2), 'utf8');
}

// GET /api/tickets
router.get('/', (req, res) => {
    let tickets = readTickets();

    const { status, priority } = req.query;

    if (status) {
        tickets = tickets.filter(ticket => ticket.status === status);
    }

    if (priority) {
        tickets = tickets.filter(ticket => ticket.priority === priority);
    }

    res.status(200).json({
        count: tickets.length,
        tickets
    });
});

// GET /api/tickets/:id
router.get('/:id', (req, res) => {
    const tickets = readTickets();
    const ticket = tickets.find(item => item.id === req.params.id);

    if (!ticket) {
        return res.status(404).json({
            error: 'Ticket not found'
        });
    }

    res.status(200).json(ticket);
});

// POST /api/tickets
router.post('/', (req, res) => {
    const { title, description, category, priority } = req.body;

    if (
        typeof title !== 'string' ||
        !title.trim() ||
        typeof description !== 'string' ||
        !description.trim()
    ) {
        return res.status(400).json({
            error: 'Title and description are required'
        });
    }

    if (title.length > 120 || description.length > 2000) {
        return res.status(400).json({
            error: 'Title or description exceeds the allowed length'
        });
    }

    const selectedPriority = priority || 'medium';

    if (!VALID_PRIORITIES.includes(selectedPriority)) {
        return res.status(400).json({
            error: 'Invalid priority',
            allowedValues: VALID_PRIORITIES
        });
    }

    const tickets = readTickets();
    const now = new Date().toISOString();

    const ticket = {
        id: randomUUID(),
        title: title.trim(),
        description: description.trim(),
        category: typeof category === 'string' && category.trim()
            ? category.trim()
            : 'general',
        priority: selectedPriority,
        status: 'open',
        createdAt: now,
        updatedAt: now
    };

    tickets.push(ticket);
    saveTickets(tickets);

    res.status(201).json({
        message: 'Ticket created successfully',
        ticket
    });
});

// PATCH /api/tickets/:id
router.patch('/:id', (req, res) => {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            error: 'Invalid status',
            allowedValues: VALID_STATUSES
        });
    }

    const tickets = readTickets();
    const ticket = tickets.find(item => item.id === req.params.id);

    if (!ticket) {
        return res.status(404).json({
            error: 'Ticket not found'
        });
    }

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    saveTickets(tickets);

    res.status(200).json({
        message: 'Ticket status updated successfully',
        ticket
    });
});

// DELETE /api/tickets/:id
router.delete('/:id', (req, res) => {
    const tickets = readTickets();
    const ticketIndex = tickets.findIndex(
        item => item.id === req.params.id
    );

    if (ticketIndex === -1) {
        return res.status(404).json({
            error: 'Ticket not found'
        });
    }

    const [deletedTicket] = tickets.splice(ticketIndex, 1);
    saveTickets(tickets);

    res.status(200).json({
        message: 'Ticket deleted successfully',
        ticket: deletedTicket
    });
});

module.exports = router;
