const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: { 
        type: Number, 
        unique: true, 
        index: true,
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    auth0Id: String,
    walletAddress: { 
        type: String, 
        lowercase: true,
        index: true 
    },
    propertyId: { 
        type: Number, 
        required: true,
        index: true 
    },
    startDate: { 
        type: Number, 
        required: true 
    },
    endDate: { 
        type: Number, 
        required: true 
    },
    amount: { 
        type: String, 
        required: true 
    },
    txHash: { 
        type: String, 
        unique: true,
        sparse: true 
    },
    status: { 
        type: String, 
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'COMPLETED'],
        default: 'PENDING',
        index: true
    },
    nftTokenId: Number,
    errorMessage: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// 复合索引
bookingSchema.index({ walletAddress: 1, createdAt: -1 });
bookingSchema.index({ propertyId: 1, status: 1 });

// 更新时自动更新时间戳
bookingSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);
