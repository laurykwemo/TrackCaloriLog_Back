const mongoose = require('mongoose');

const sexSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    label: { type: String, required: true },
    bmrCoef: { type: Number, required: true },
    description: { type: String, required: true },
}, { _id: false, collection: 'sexes' });

const UserSex = mongoose.model('Sex', sexSchema);

module.exports = UserSex;