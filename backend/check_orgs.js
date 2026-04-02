const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}).select('name email role organization');
        console.log('--- User List with Organization ---');
        users.forEach(u => {
            console.log(`Name: ${u.name} | Role: ${u.role} | Org: ${u.organization || 'MISSING'}`);
        });
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
