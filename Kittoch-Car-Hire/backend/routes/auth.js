const express = require('express');
const router = express.Router();
const authenticateEmployee = require('../services/authService');

// Authenticate employee
router.post('/login', async (req, res) => {
    try {
        const result = await authenticateEmployee(req.body.EmployeeId, req.body.Password);
        res.status(200).json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

module.exports = router;
