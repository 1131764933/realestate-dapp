const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    auth0Id: { type: String, unique: true, sparse: true },
    walletAddress: { 
        type: String, 
        unique: true, 
        sparse: true, 
        lowercase: true 
    },
    email: String,
    favorites: [{ type: Number }],
    points: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// 更新时自动更新时间戳
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('User', userSchema);
