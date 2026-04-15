const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

dotenv.config();

const cleanupUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ organization: { $exists: false } });
        
        console.log(`--- Cleaning up ${users.length} users ---`);
        
        for (const user of users) {
            // Assign each legacy user to an organization named after them to separate them
            user.organization = `${user.name}'s Org`;
            await user.save();
            console.log(`Updated: ${user.name} -> Org: ${user.organization}`);
        }
        
        console.log('--- Cleanup Complete ---');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanupUsers();
