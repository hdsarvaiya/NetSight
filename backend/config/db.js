const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,  // 10s to pick a server
            socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity
            heartbeatFrequencyMS: 10000,      // Check connection every 10s
            maxPoolSize: 10,                  // Maintain up to 10 socket connections
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle disconnections gracefully
        mongoose.connection.on('disconnected', () => {
            console.warn('[DB] MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('[DB] MongoDB reconnected successfully.');
        });

        mongoose.connection.on('error', (err) => {
            console.error('[DB] MongoDB connection error:', err.message);
        });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
