const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    instituteId: { type: String, required: true },
    sessionId: { type: String, required: true },
    eventType: { type: String, required: true },
    interactionId: { type: String, default: '' },
    queryText: { type: String },
    metaData: { type: mongoose.Schema.Types.Mixed }, // Flexible JSON
    createdAt: { type: Date, default: Date.now }
});

module.exports = interactionSchema;
