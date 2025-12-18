const mongoose = require('mongoose');

const deletedUserSchema = new mongoose.Schema({
    originalUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: String,
    email: String,
    password: { type: String, required: true },
    birthDate: Date,
    sex: { 
        type: Number,
        ref: 'Sex',
        required: true 
    },
    height: Number,
    weight: Number,
    role: String,
    isActive: Boolean,
    deletedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const DeletedUser = mongoose.model('DeletedUser', deletedUserSchema);
module.exports = DeletedUser;
