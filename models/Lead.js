const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    instituteId: { type: String, required: true },
    sessionId: { type: String, required: true },
    leadData: { type: mongoose.Schema.Types.Mixed, required: true }, // Store flexible JSON data
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);
