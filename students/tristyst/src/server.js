
require('dotenv').config();

const express = require('express');
const ticketsRouter = require('./tickets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'Campus Helpdesk API',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/tickets', ticketsRouter);

app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found'
    });
});

app.use((err, req, res, next) => {
    console.error(err);

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Invalid JSON request body'
        });
    }

    res.status(500).json({
        error: 'Internal server error'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Campus Helpdesk API is running on port ${PORT}`);
});
