const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    //id: {type: String, required: true},
    name: {type: String, required:true},
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
    },
    password: {type: String, required: true},
    birthDate: {type: Date, required: true, minlength: 8},
    sex: { 
        type: Number,
        ref: 'Sex',
        required: true 
    },
    height: {type: Number, required: true},
    weight: {type: Number, required: true},
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: { type: Boolean, default: true },
    
    // AUTHENTIFICATION
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // OPTIONNEL (sécurité)
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;