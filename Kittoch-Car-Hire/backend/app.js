require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectToDatabase = require('./db');

// Initialize the Express application
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
(async () => {
    try {
        await connectToDatabase();
    } catch (error) {
        console.error("Failed to connect to MongoDB. Exiting...");
        process.exit(1);
    }
})();

// Import routes
const universalCRUD = require("./routes/universalCRUD"); // Route for the universal API
const authRoutes = require("./routes/auth"); // Route for authentication

// Attach routes
app.use('/api/universalCRUD', universalCRUD);
app.use('/api/auth', authRoutes);

// Error handler
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Root route handler
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
