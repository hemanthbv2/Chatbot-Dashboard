const mongoose = require('mongoose');

const rawLogSchema = new mongoose.Schema({
    instituteId: { type: String, required: true },
    sessionId: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed },
    receivedAt: { type: Date, default: Date.now }
}, { strict: false });

module.exports = rawLogSchema;
