const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const Device = require('./models/deviceModel');
const Alert = require('./models/alertModel');
const DeviceMetric = require('./models/deviceMetricModel');

dotenv.config();

const migrateData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Data Migration: User -> Organization ---');

        const users = await User.find({});
        console.log(`Found ${users.length} users to process...`);

        for (const user of users) {
            if (!user.organization) {
                console.log(`Skipping user ${user.name} (No organization set)`);
                continue;
            }

            console.log(`\nMigrating data for user ${user.name} | Org: ${user.organization}`);

            // 1. Migrate Devices
            const deviceResult = await Device.updateMany(
                { user: user._id, organization: { $exists: false } },
                { $set: { organization: user.organization } }
            );
            console.log(`- Updated ${deviceResult.modifiedCount} devices`);

            // 2. Migrate Alerts
            const alertResult = await Alert.updateMany(
                { user: user._id, organization: { $exists: false } },
                { $set: { organization: user.organization } }
            );
            console.log(`- Updated ${alertResult.modifiedCount} alerts`);

            // 3. Migrate Metrics
            const metricResult = await DeviceMetric.updateMany(
                { user: user._id, organization: { $exists: false } },
                { $set: { organization: user.organization } }
            );
            console.log(`- Updated ${metricResult.modifiedCount} metrics`);
        }

        console.log('\n--- Migration Complete ---');
        process.exit();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateData();
