// backend/services/databaseInit.js

const mongoose = require('mongoose');
const { Staff, Student, Course, Enrollment } = require('../models/models');

async function initializeDatabase() {
    try {
        // Check if the database exists
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection is not established');
        }

        // Get a list of all collections in the database
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        // Check the availability of collections and their relevance to the models
        const models = {
            Staff: Staff.collection.name,
            Student: Student.collection.name,
            Course: Course.collection.name,
            Enrollment: Enrollment.collection.name
        };

        for (const [modelName, collectionName] of Object.entries(models)) {
            if (!collectionNames.includes(collectionName)) {
                // If there is no collection, create one
                await mongoose.model(modelName).createCollection();
                console.log(`Collection ${collectionName} created.`);
            } else {
                console.log(`Collection ${collectionName} already exists.`);
            }
        }

        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Error during database initialization:', error);
        throw error;
    }
}

module.exports = initializeDatabase;