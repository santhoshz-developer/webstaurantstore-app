
const express = require("express");
require("dotenv/config");
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Import configurations
const { testConnection } = require('./config/database');
const { connectRedis } = require('./config/redis');

// Import routes
const shopRoutes = require('./routes/shop');
const { errorHandler } = require("./utils");

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyStore: 'memory',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      success: false,
      message: 'Too many requests'
    });
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 4000;

// API Routes
app.use("/api/shops", shopRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "Modular Shop System API"
  });
});

// Welcome endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Modular Shop System API!",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      shops: "/api/shops",
      scan: "/api/shops/scan-qr"
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Connect to Redis
    await connectRedis();
    
    // Start server
    app.listen(PORT, () => {
      const host = "localhost"; 
      console.log(`🚀 Server running at http://${host}:${PORT}`);
      console.log(`📊 Health check: http://${host}:${PORT}/health`);
      console.log(`🔍 QR Scan endpoint: http://${host}:${PORT}/api/shops/scan-qr`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
