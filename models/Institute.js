const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
    instituteId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    apiKey: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Institute', instituteSchema);
