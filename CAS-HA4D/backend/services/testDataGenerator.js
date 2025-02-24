// backend/services/testDataGenerator.js

const { Staff, Student, Course, Enrollment } = require('../models/models');

class TestDataGenerator {
    static async generateTestData() {
        const existingStaff = await Staff.countDocuments();
        const existingStudents = await Student.countDocuments();
        const existingCourses = await Course.countDocuments();

        const studentsArray = [];
        const coursesArray = [];

        // Generate 12 staff members
        for (let i = existingStaff + 1; i <= existingStaff + 12; i++) {
            await Staff.create({
                idNumber: `STF${String(i).padStart(3, '0')}`,
                forename: `John ${this.toRomanNumerals(i)}`,
                surname: `Smith ${this.toRomanNumerals(i)}`,
                dob: this.generateRandomDate(1960, 1990),
                gender: this.getRandomGender()
            });
        }

        // Generate 60 students
        for (let i = existingStudents + 1; i <= existingStudents + 60; i++) {
            const student = await Student.create({
                idNumber: `STU${String(i).padStart(3, '0')}`,
                forename: `Jane ${this.toRomanNumerals(i)}`,
                surname: `Doe ${this.toRomanNumerals(i)}`,
                dob: this.generateRandomDate(1990, 2005),
                gender: this.getRandomGender()
            });
            studentsArray.push(student);
        }

        // Split students into 4 groups of 15 students each
        const studentPools = [];
        for (let i = 0; i < 4; i++) {
            studentPools.push(studentsArray.slice(i * 15, (i + 1) * 15));
        }

        // Generate 8 courses
        for (let i = existingCourses + 1; i <= existingCourses + 8; i++) {
            const course = await Course.create({
                courseId: `CRS${String(i).padStart(3, '0')}`,
                courseName: `Course ${this.toRomanNumerals(i)}`,
                courseStart: this.generateRandomDate(2024, 2025),
                courseLength: Math.floor(Math.random() * 48) + 4, // 4-52 weeks
                courseLocation: `Room ${Math.floor(Math.random() * 100) + 1}`
            });
            coursesArray.push(course);
        }

        // Assign students to courses using round-robin selection of student pools
        for (let i = 0; i < coursesArray.length; i++) {
            const studentPool = studentPools[i % 4];
            for (const student of studentPool) {
                await Enrollment.create({
                    studentId: student._id,
                    courseId: coursesArray[i]._id
                });
            }
        }

        console.log('Test data generation completed.');
    }

    static toRomanNumerals(num) {
        const romanNumerals = [
            { value: 10, numeral: 'X' },
            { value: 9, numeral: 'IX' },
            { value: 5, numeral: 'V' },
            { value: 4, numeral: 'IV' },
            { value: 1, numeral: 'I' }
        ];
        
        let result = '';
        for (let { value, numeral } of romanNumerals) {
            while (num >= value) {
                result += numeral;
                num -= value;
            }
        }
        return result;
    }

    static generateRandomDate(startYear, endYear) {
        const start = new Date(startYear, 0, 1);
        const end = new Date(endYear, 11, 31);
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    static getRandomGender() {
        const genders = ['M', 'F', 'Other'];
        return genders[Math.floor(Math.random() * genders.length)];
    }
}

module.exports = TestDataGenerator;
