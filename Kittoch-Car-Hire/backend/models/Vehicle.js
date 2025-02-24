const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    VehicleId: {
        type: String,
        required: true,
        unique: true,
        metadata: {
            label: 'Vehicle ID',
            placeholder: 'Enter vehicle ID',
            type: 'text',
            required: true
        }
    },
    Make: {
        type: String,
        metadata: {
            label: 'Make',
            placeholder: 'Select or enter make',
            type: 'select',
            required: true,
            setting: 'collections.json#vehicle.make'
        }
    },
    Model: {
        type: String,
        metadata: {
            label: 'Model',
            placeholder: 'Select or enter model',
            type: 'select',
            required: true,
            setting: 'collections.json#vehicle.make.model'
        }
    },
    Category: {
        type: String,
        metadata: {
            label: 'Category',
            placeholder: 'Select category',
            type: 'select',
            required: true,
            setting: 'collections.json#vehicle.category'
        }
    },
    Passengers: {
        type: Number,
        metadata: {
            label: 'Number of Passengers',
            placeholder: 'Enter number of passengers',
            type: 'number',
            required: true
        }
    },
    Capacity: {
        type: String,
        metadata: {
            label: 'Capacity',
            placeholder: 'Enter capacity',
            type: 'text',
            required: true
        }
    },
    Fuel: {
        type: String,
        metadata: {
            label: 'Fuel Type',
            placeholder: 'Select fuel type',
            type: 'select',
            required: true,
            setting: 'collections.json#vehicle.fuel'
        }
    },
    DateOfPurchase: {
        type: Date,
        metadata: {
            label: 'Purchase Date',
            placeholder: 'Select purchase date',
            type: 'date',
            required: true
        }
    },
    Availability: {
        type: Boolean,
        metadata: {
            label: 'Available',
            placeholder: 'Select availability',
            type: 'checkbox',
            readonly: true,
            required: false
        }
    },
    CostPerDay: {
        type: Number,
        metadata: {
            label: 'Cost per Day',
            placeholder: 'Enter daily cost',
            type: 'number',
            step: 0.01,
            required: true
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
