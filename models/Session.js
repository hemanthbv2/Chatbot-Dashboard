const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    instituteId: { type: String, required: true },
    sessionId: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    eventCount: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    dwellSeconds: { type: Number, default: 0 },
    deviceInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastIntent: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
    leadCaptured: { type: Boolean, default: false }
}, { strict: false, timestamps: true });

module.exports = sessionSchema;
