const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    EmployeeId: {
        type: String,
        required: true,
        unique: true,
        metadata: {
            label: 'Employee ID (Email)',
            placeholder: 'Enter employee email',
            type: 'email',
            required: true
        }
    },
    Password: {
        type: String,
        required: true,
        metadata: {
            label: 'Password',
            placeholder: 'Enter password',
            type: 'password',
            required: true
        }
    },
    Gender: {
        type: String,
        metadata: {
            label: 'Gender',
            placeholder: 'Select gender',
            type: 'select',
            required: true,
            setting: 'collections.json#customer.gender'
        }
    },
    Forename: {
        type: String,
        metadata: {
            label: 'First Name',
            placeholder: 'Enter first name',
            type: 'text',
            required: true
        }
    },
    Surname: {
        type: String,
        metadata: {
            label: 'Last Name',
            placeholder: 'Enter last name',
            type: 'text',
            required: true
        }
    },
    DateOfBirth: {
        type: Date,
        metadata: {
            label: 'Date of Birth',
            placeholder: 'Select date of birth',
            type: 'date',
            required: true
        }
    },
    LicenceNumber: {
        type: String,
        metadata: {
            label: 'Licence Number',
            placeholder: 'Enter licence number',
            type: 'text',
            required: true
        }
    },
    Street: {
        type: String,
        metadata: {
            label: 'Street Address',
            placeholder: 'Enter street address',
            type: 'text',
            required: true
        }
    },
    Town: {
        type: String,
        metadata: {
            label: 'Town/City',
            placeholder: 'Enter town or city',
            type: 'text',
            required: true
        }
    },
    Postcode: {
        type: String,
        metadata: {
            label: 'Postcode',
            placeholder: 'Enter postcode',
            type: 'text',
            required: true
        }
    },
    Phone: {
        type: String,
        metadata: {
            label: 'Phone Number',
            placeholder: 'Enter phone number',
            type: 'tel',
            required: true
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
