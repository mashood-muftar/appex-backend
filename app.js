import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './dbConnection/dbConnection.js';
import morgan from 'morgan';
import fs from 'fs';
import logger from './utils/logger.js';
import apiLogger from './middleware/apiLogger.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import supplementRoutes from './routes/supplementRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import guideRoutes from './routes/guideRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import friendsRoutes from './routes/friendsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { initializeAllSchedules, scheduleStatusReset } from './utils/schedulerService.js';

const app = express();
//automation checkig

// Ensure logs directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)){
    fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// Setup logging middleware - use morgan with winston
app.use(morgan('combined', { stream: logger.stream }));
app.use(apiLogger);

// Setup static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/supplements', supplementRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the EMBER ON API');
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error({
        message: 'Server error',
        error: err.message,
        stack: err.stack,
        path: req.path
    });
    
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Handle 404 errors
app.use((req, res) => {
    logger.warn({
        message: 'Route not found',
        path: req.path,
        method: req.method
    });
    
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Initialize schedules
        await initializeAllSchedules();
        logger.info('All supplement notifications scheduled successfully');
        
        // Setup daily status reset job
        scheduleStatusReset();
        
        // Start server
        const port = process.env.PORT || 5000;
        app.listen(port, () => {
            logger.info(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
//testing
export default app;