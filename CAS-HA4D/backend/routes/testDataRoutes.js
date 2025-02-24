// backend/routes/testDataRoutes.js

const express = require('express');
const router = express.Router();
const TestDataGenerator = require('../services/testDataGenerator');

router.post('/generate', async (req, res) => {
    try {
        await TestDataGenerator.generateTestData();
        res.status(200).json({ message: 'Test data generated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
