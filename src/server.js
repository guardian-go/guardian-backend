import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDb from "./db/database.js";
import router from "./routes/router.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Store io instance for use in routes/controllers
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true
}));
// Increase body size limit for JSON (for base64 images during upload)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
// Logging middleware - use 'combined' for production, 'dev' for development
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.use('/api', router);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        const mongoose = (await import('mongoose')).default;
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        
        res.status(200).json({ 
            status: 'OK', 
            message: 'Server is running',
            database: dbStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'ERROR', 
            message: 'Server health check failed',
            error: error.message 
        });
    }
});

// 404 handler for undefined routes (must be after all routes)
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.method} ${req.path} not found` 
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room based on user ID
    socket.on('join-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
    });

    // Leave room
    socket.on('leave-room', (userId) => {
        socket.leave(`user-${userId}`);
        console.log(`User ${userId} left their room`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

// Warn about missing environment variables (but don't break the app)
if (!process.env.SECRET || process.env.SECRET === 'default_secret') {
    console.warn('⚠️  WARNING: JWT SECRET not set or using default. This is insecure for production!');
}

if (!process.env.CLIENT_URL || process.env.CLIENT_URL === '*') {
    console.warn('⚠️  WARNING: CLIENT_URL not set. CORS is allowing all origins. This is insecure for production!');
}

// Global error handler (must be after all routes)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Don't expose error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;
    
    res.status(err.status || 500).json({ 
        success: false, 
        message: message 
    });
});

httpServer.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    connectDb();
});

export { io };
