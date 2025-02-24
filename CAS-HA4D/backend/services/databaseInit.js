// backend/services/databaseInit.js

const mongoose = require('mongoose');
const { Staff, Student, Course, Enrollment } = require('../models/models');

async function initializeDatabase() {
    try {
        const db = mongoose.connection.db;
        if (!db) throw new Error('Database connection is not established');

        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        const models = [
            { name: 'Staff', model: Staff },
            { name: 'Student', model: Student },
            { name: 'Course', model: Course },
            { name: 'Enrollment', model: Enrollment }
        ];

        for (const { name, model } of models) {
            if (!model) {
                console.error(`Model ${name} is undefined. Check your imports.`);
                continue;
            }

            if (!collectionNames.includes(model.collection.name)) {
                await model.createCollection();
                console.log(`Collection ${model.collection.name} created.`);
            } else {
                console.log(`Collection ${model.collection.name} already exists.`);
            }
        }

        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Error during database initialization:', error);
        throw error;
    }
}

module.exports = initializeDatabase;
