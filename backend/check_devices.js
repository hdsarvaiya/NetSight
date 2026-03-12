const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Device = require('./models/deviceModel');

    // Delete devices with no user or no IP
    const result = await Device.deleteMany({
        $or: [
            { user: null },
            { user: { $exists: false } },
            { ip: null },
            { ip: { $exists: false } },
            { ip: 'undefined' },
        ]
    });
    console.log('Deleted corrupted devices:', result.deletedCount);

    const remaining = await Device.find({});
    console.log('Remaining valid devices:', remaining.length);
    remaining.forEach(d => {
        console.log(`  IP: ${d.ip} | Type: ${d.type} | User: ${d.user} | Name: ${d.name}`);
    });

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
