const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    BookingId: {
        type: String,
        required: true,
        unique: true,
        metadata: {
            label: 'Booking ID',
            placeholder: 'Enter booking ID',
            type: 'text',
            readonly: true,
            required: true
        }
    },
    CustomerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        metadata: {
            label: 'Customer',
            placeholder: 'Select customer',
            type: 'select',
            required: true
        }
    },
    BookingDate: {
        type: Date,
        default: Date.now,
        metadata: {
            label: 'Booking Date',
            placeholder: 'Select booking date',
            type: 'date',
            required: true
        }
    },
    PickupLocation: {
        type: String,
        metadata: {
            label: 'Pickup Location',
            placeholder: 'Enter pickup location',
            type: 'text',
            required: false
        }
    },
    StartDate: {
        type: Date,
        metadata: {
            label: 'Start Date',
            placeholder: 'Select start date',
            type: 'date',
            required: true
        }
    },
    StartTime: {
        type: String,
        metadata: {
            label: 'Start Time',
            placeholder: 'Select start time',
            type: 'time',
            required: false
        }
    },
    ReturnDate: {
        type: Date,
        metadata: {
            label: 'Return Date',
            placeholder: 'Select return date',
            type: 'date',
            required: false
        }
    },
    ReturnTime: {
        type: String,
        metadata: {
            label: 'Return Time',
            placeholder: 'Select return time',
            type: 'time',
            required: false
        }
    },
    CarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
        metadata: {
            label: 'Vehicle',
            placeholder: 'Select vehicle',
            type: 'select',
            required: true
        }
    },
    DropoffLocation: {
        type: String,
        metadata: {
            label: 'Dropoff Location',
            placeholder: 'Enter dropoff location',
            type: 'text',
            required: false
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
