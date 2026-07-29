const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'institute_admin'], default: 'institute_admin' },
    instituteId: { type: String, default: null }, // Null for super_admin
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
