const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 15000,   // 15s to pick a server
            socketTimeoutMS: 0,                // Disable socket timeout (let Atlas manage)
            heartbeatFrequencyMS: 30000,       // Check connection every 30s (default, less aggressive)
            maxPoolSize: 10,                   // Maintain up to 10 socket connections
            minPoolSize: 2,                    // Keep at least 2 connections alive
            maxIdleTimeMS: 60000,              // Close idle connections after 60s
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle disconnections gracefully — only log once, don't spam
        let disconnectLogged = false;

        mongoose.connection.on('disconnected', () => {
            if (!disconnectLogged) {
                disconnectLogged = true;
                console.warn('[DB] MongoDB disconnected. Driver will auto-reconnect.');
            }
        });

        mongoose.connection.on('reconnected', () => {
            if (disconnectLogged) {
                console.log('[DB] MongoDB reconnected successfully.');
                disconnectLogged = false;
            }
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
