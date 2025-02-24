// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require("body-parser");
require('dotenv').config();
const connectToDatabase = require('./services/db');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
});



const initializeDatabase = require('./services/databaseInit');

// Database initialization and connection
(async () => {
    try {
        await connectToDatabase();
        await initializeDatabase(); // Initialize database
    } catch (error) {
        console.error("Failed to initialize database. Exiting...");
        process.exit(1);
    }
})();

// Import routes
const apiRouters = require("./routes/routes");
const testDataRoutes = require('./routes/testDataRoutes');


// Attach routes
app.use('/api',apiRouters);
app.use('/api/testdata', testDataRoutes);

// Keep-alive ping for render.com
const keepAlive = () => {
    setInterval(() => {
        fetch(process.env.APP_URL)
            .then(() => console.log('Keep-alive ping sent'))
            .catch(err => console.error('Keep-alive ping failed:', err));
    }, 2 * 60 * 1000); // Ping every 2 minutes
};

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    keepAlive();
});