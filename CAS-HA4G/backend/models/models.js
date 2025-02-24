// backend/models/models.js


// staff
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    idNumber: { 
        type: String, 
        required: true, 
        unique: true 
    },
    forename: { 
        type: String, 
        required: true 
    },
    surname: { 
        type: String, 
        required: true 
    },
    dob: { 
        type: Date, 
        required: true 
    },
    gender: { 
        type: String, 
        enum: ['M', 'F', 'Other'], 
        required: true 
    }
});

// student
const studentSchema = new mongoose.Schema({
    idNumber: { 
        type: String, 
        required: true, 
        unique: true 
    },
    forename: { 
        type: String, 
        required: true 
    },
    surname: { 
        type: String, 
        required: true 
    },
    dob: { 
        type: Date, 
        required: true 
    },
    gender: { 
        type: String, 
        enum: ['M', 'F', 'Other'], 
        required: true 
    }
});

// course
const courseSchema = new mongoose.Schema({
    courseId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    courseName: { 
        type: String, 
        required: true 
    },
    courseStart: { 
        type: Date, 
        required: true 
    },
    courseLength: { 
        type: Number, 
        required: true 
    }, // in weeks
    courseLocation: { 
        type: String, 
        required: true 
    }
});

// enrollment
const enrollmentSchema = new mongoose.Schema({
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student', 
        required: true 
    },
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    enrollmentDate: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = {
    Staff: mongoose.model('Staff', staffSchema),
    Student: mongoose.model('Student', studentSchema),
    Course: mongoose.model('Course', courseSchema),
    Enrollment: mongoose.model('Enrollment', enrollmentSchema)
};