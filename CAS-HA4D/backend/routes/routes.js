// backend/routes/routes.js

const express = require('express');
const router = express.Router();
const { Staff, Student, Course, Enrollment } = require('../models/models');

// CORS and logging middleware
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

router.use((req, res, next) => {
    console.log("Incoming request:", {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        body: req.body,
        query: req.query,
    });
    next();
});

// Staff routes
router.get('/staff', async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/staff/:id', async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/staff', async (req, res) => {
    const staff = new Staff(req.body);
    try {
        const newStaff = await staff.save();
        res.status(201).json(newStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/staff/:id', async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(staff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/staff/:id', async (req, res) => {
    try {
        await Staff.findByIdAndDelete(req.params.id);
        res.json({ message: 'Staff member deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Student routes
router.get('/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/students/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/students', async (req, res) => {
    const student = new Student(req.body);
    try {
        const newStudent = await student.save();
        res.status(201).json(newStudent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/students/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(student);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/students/:id', async (req, res) => {
    try {
        // First delete all enrollments for this student
        await Enrollment.deleteMany({ studentId: req.params.id });
        // Then delete the student
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student and related enrollments deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Course routes
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/courses', async (req, res) => {
    const course = new Course(req.body);
    try {
        const newCourse = await course.save();
        res.status(201).json(newCourse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(course);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/courses/:id', async (req, res) => {
    try {
        // First delete all enrollments for this course
        await Enrollment.deleteMany({ courseId: req.params.id });
        // Then delete the course
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course and related enrollments deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Enrollment routes
router.get('/enrollments', async (req, res) => {
    try {
        const enrollments = await Enrollment.find()
            .populate('studentId')
            .populate('courseId');
        res.json(enrollments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/enrollments/:id', async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
            .populate('studentId')
            .populate('courseId');
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        res.json(enrollment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/enrollments/course/:courseId', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ courseId: req.params.courseId })
            .populate('studentId');
        res.json(enrollments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/enrollments/student/:studentId', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ studentId: req.params.studentId })
            .populate('courseId');
        res.json(enrollments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/enrollments', async (req, res) => {
    try {
        // Check if enrollment already exists
        const existingEnrollment = await Enrollment.findOne({
            studentId: req.body.studentId,
            courseId: req.body.courseId
        });
        
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Student is already enrolled in this course' });
        }

        const enrollment = new Enrollment(req.body);
        const newEnrollment = await enrollment.save();

        // Populate the response with student and course details
        const populatedEnrollment = await Enrollment.findById(newEnrollment._id)
            .populate('studentId')
            .populate('courseId');

        res.status(201).json(populatedEnrollment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/enrollments/:id', async (req, res) => {
    try {
        await Enrollment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Enrollment deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;