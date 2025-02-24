const mongoose = require('mongoose');

async function connectToDatabase() {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kittoch-car-hire';
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Successfully connected to MongoDB Atlas!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

module.exports = connectToDatabase;
