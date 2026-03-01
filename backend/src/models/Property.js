const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    propertyId: { 
        type: Number, 
        unique: true, 
        index: true,
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    description: String,
    imageUrl: String,
    location: String,
    price: { 
        type: mongoose.Schema.Types.BigInt, 
        required: true 
    },
    owner: String,
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// 索引
propertySchema.index({ isActive: 1, propertyId: 1 });

// 更新时自动更新时间戳
propertySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Property', propertySchema);
