const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    //id: {type: String, required: true},
    name: {type: String, required:true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    birthDate: {type: Date, required: true},
    sex: { 
        type: Number,
        ref: 'Sex',
        required: true 
    },
    height: {type: Number, required: true},
    weight: {type: Number, required: true},
    role: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'User'
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;