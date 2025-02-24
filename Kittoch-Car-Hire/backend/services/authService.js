const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');

/**
 * Authenticate an employee.
 * @param {String} EmployeeId - Employee ID.
 * @param {String} Password - Employee password.
 * @returns {Object} - Success message and employee data.
 */
async function authenticateEmployee(EmployeeId, Password) {
    const employee = await Employee.findOne({ EmployeeId });
    if (!employee) throw new Error("Employee not found.");

    const isPasswordValid = await bcrypt.compare(Password, employee.Password);
    if (!isPasswordValid) throw new Error("Invalid password.");

    return { message: "Login successful!", employee };
}

module.exports = authenticateEmployee;
