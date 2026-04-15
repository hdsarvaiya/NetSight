const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); // New import
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const { startMonitoring } = require('./services/monitoringAgent');
const socketIO = require('./utils/socket'); // New import

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketIO.init(server);

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:9090', // for agent UI
        'https://netsight-mu.vercel.app',
        'https://netslight-test.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

// Explicitly handle all OPTIONS requests (crucial for Vercel serverless platform)
app.options('*', cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:9090',
        'https://netsight-mu.vercel.app',
        'https://netslight-test.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/devices', require('./routes/deviceRoutes'));
app.use('/api/v1/monitoring', require('./routes/monitoringRoutes'));
app.use('/api/v1/audit', require('./routes/auditRoutes'));
app.use('/api/v1/settings', require('./routes/settingsRoutes'));
app.use('/api/v1/agent', require('./routes/agentRoutes'));

app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start the monitoring agent after server is ready
    startMonitoring();
});
