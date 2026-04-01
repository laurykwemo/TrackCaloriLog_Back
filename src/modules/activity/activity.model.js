const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true // Optimise les recherches pour le module report
    },
    date: { 
        type: Date, 
        required: true, 
        index: true 
    },
    caloriesBurned: { 
        type: Number, 
        required: true,
        min: [0, "Les calories ne peuvent pas être négatives"] 
    },
    source: { 
        type: String, 
        required: true,
        enum: ['Apple Watch', 'Galaxy Watch', 'Manual', 'Google Fit'] // Optionnel : limite les sources
    },
    // ID unique venant de la montre (pour éviter les doublons lors des synchronisations)
    externalId: { 
        type: String, 
        unique: true, 
        sparse: true 
    }
}, { timestamps: true });

// Index composé pour accélérer la récupération des rapports par utilisateur et par date
activitySchema.index({ userId: 1, date: -1 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;