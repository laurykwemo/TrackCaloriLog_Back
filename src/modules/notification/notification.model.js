const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: { type: String, default: 'security_alert' }, // ex: security_alert, system, etc.
    message: { type: String, required: true },
    userEmail: { type: String },
    ipAddress: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);