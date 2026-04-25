const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const { startMonitoring } = require('./services/monitoringAgent');
const socketIO = require('./utils/socket');
const liveState = require('./utils/liveState');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketIO.init(server);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || origin.includes('localhost') || origin.includes('vercel.app') || origin.includes('netsight.online')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

// Explicitly handle all OPTIONS requests (crucial for Vercel serverless platform)
app.options('*', cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:9090',
        'https://netsight-mu.vercel.app',
        'http://localhost:5000'
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

// Connect to MongoDB FIRST, then start server + monitoring
async function start() {
    try {
        await connectDB();

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            // Start monitoring only after DB is connected
            startMonitoring();
            // Start batch writer for historical data (every 5 min)
            liveState.startBatchWriter();
        });
    } catch (error) {
        console.error('[STARTUP] Failed to start:', error.message);
        process.exit(1);
    }
}

start();

// Catch unhandled promise rejections (MongoDB driver errors during network disruptions)
process.on('unhandledRejection', (err) => {
    if (err && (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError')) {
        // Condense to one line instead of 50-line stack traces
        console.warn(`[DB] ${err.cause?.cause?.code || err.message}`);
    } else {
        console.error('[UNHANDLED]', err?.message || err);
    }
});
