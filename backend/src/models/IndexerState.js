const mongoose = require('mongoose');

const indexerStateSchema = new mongoose.Schema({
    name: { 
        type: String, 
        default: 'default',
        unique: true 
    },
    lastProcessedBlock: { 
        type: Number, 
        default: 0 
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IndexerState', indexerStateSchema);
