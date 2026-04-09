const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Alert = require('../models/alertModel');
const connectDB = require('../config/db');
const path = require('path');

// Load env from one level up
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('URI Loaded:', process.env.MONGO_URI ? 'YES' : 'NO');
console.log('Path checked:', path.join(__dirname, '../.env'));

const migrate = async () => {
    try {
        await connectDB();
        console.log('Migrating Alerts status...');
        
        // Find alerts without a status
        const alertsToFix = await Alert.find({ 
            $or: [
                { status: { $exists: false } },
                { status: '' },
                { status: null }
            ]
        });
        
        console.log(`Found ${alertsToFix.length} alerts to fix.`);
        
        let fixedCount = 0;
        for (const alert of alertsToFix) {
            // Force save to trigger pre-save hook
            alert.status = alert.acknowledged ? 'ACKNOWLEDGED' : 'NEW';
            await alert.save();
            fixedCount++;
        }
        
        console.log(`Successfully migrated ${fixedCount} alerts.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
