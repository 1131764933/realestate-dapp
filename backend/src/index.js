require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const { initBlockchainService, getBlockchainService } = require('./services');
const propertiesRouter = require('./routes/properties');
const bookingsRouter = require('./routes/bookings');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/properties', propertiesRouter);
app.use('/api/bookings', bookingsRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate');
        console.log('Connected to MongoDB');
        
        // 初始化区块链服务
        initBlockchainService();
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
    }
};

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    connectDB();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    await mongoose.connection.close();
    process.exit(0);
});

module.exports = app;
