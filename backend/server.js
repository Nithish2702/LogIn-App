const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const User = require('./models/User');

const app = express();

// Security middleware
app.use(helmet()); // Adds security headers
app.use(mongoSanitize()); // Prevents MongoDB injection

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL === '*' 
        ? '*' 
        : (process.env.NODE_ENV === 'production' 
            ? process.env.FRONTEND_URL 
            : ['http://localhost:5173', 'http://localhost:3000']),
    credentials: process.env.FRONTEND_URL === '*' ? false : true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser with size limits
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));

// Request logging middleware
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] ${req.method} ${req.url}`);
        if (req.body && Object.keys(req.body).length > 0) {
            const sanitizedBody = { ...req.body };
            if (sanitizedBody.password) sanitizedBody.password = '***';
            console.log('Body:', JSON.stringify(sanitizedBody, null, 2));
        }
    }
    next();
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Rate limiting configurations
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: 'Too many accounts created, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later',
});

app.use(generalLimiter);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Login API Server is running',
        version: '1.0.0',
        endpoints: {
            register: 'POST /register',
            login: 'POST /login',
            health: 'GET /health'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Input validation helper
const validateInput = (username, password) => {
    const errors = [];
    
    if (!username || typeof username !== 'string') {
        errors.push('Username is required and must be a string');
    } else {
        if (username.length < 3) {
            errors.push('Username must be at least 3 characters');
        }
        if (username.length > 30) {
            errors.push('Username must not exceed 30 characters');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }
    }
    
    if (!password || typeof password !== 'string') {
        errors.push('Password is required and must be a string');
    } else {
        if (password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        if (password.length > 128) {
            errors.push('Password must not exceed 128 characters');
        }
    }
    
    return errors;
};

// Register endpoint
app.post('/register', registerLimiter, async (req, res) => {
    const logPrefix = process.env.NODE_ENV !== 'production' ? '🔵 REGISTER:' : '';
    
    try {
        const { username, password } = req.body;
        
        if (process.env.NODE_ENV !== 'production') {
            console.log(`${logPrefix} Request received for username: ${username}`);
        }

        // Validate input
        const validationErrors = validateInput(username, password);
        if (validationErrors.length > 0) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`${logPrefix} Validation failed:`, validationErrors);
            }
            return res.status(400).json({ 
                message: validationErrors[0],
                errors: validationErrors 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`${logPrefix} User already exists`);
            }
            return res.status(409).json({ message: 'Username already exists' });
        }

        // Create new user
        const user = new User({ 
            username: username.toLowerCase(), 
            password 
        });
        await user.save();

        if (process.env.NODE_ENV !== 'production') {
            console.log(`${logPrefix} User registered successfully: ${username}`);
        }

        res.status(201).json({ 
            message: 'User registered successfully',
            username: user.username
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Server error during registration',
            error: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});

// Login endpoint
app.post('/login', loginLimiter, async (req, res) => {
    const logPrefix = process.env.NODE_ENV !== 'production' ? '🔵 LOGIN:' : '';
    
    try {
        const { username, password } = req.body;
        
        if (process.env.NODE_ENV !== 'production') {
            console.log(`${logPrefix} Request received for username: ${username}`);
        }

        // Validate input
        const validationErrors = validateInput(username, password);
        if (validationErrors.length > 0) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`${logPrefix} Validation failed`);
            }
            return res.status(400).json({ 
                message: 'Invalid credentials'
            });
        }

        // Find user in database (case-insensitive)
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`${logPrefix} User not found`);
            }
            // Don't reveal if user exists or not
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`${logPrefix} Invalid password`);
            }
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        if (process.env.NODE_ENV !== 'production') {
            console.log(`${logPrefix} Login successful: ${username}`);
        }

        res.status(200).json({ 
            message: 'Login successful',
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login',
            error: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Endpoint not found',
        path: req.url
    });
});

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../frotend/dist');
    app.use(express.static(frontendPath));
    
    // Handle React routing - return index.html for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

const server = app.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log('========================================');
    console.log('Available endpoints:');
    console.log('  GET  / - Server status');
    console.log('  GET  /health - Health check');
    console.log('  POST /register - Create new user');
    console.log('  POST /login - User login');
    console.log('========================================\n');
});
