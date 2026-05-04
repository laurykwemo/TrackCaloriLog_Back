const mongoose = require('mongoose');

// --- 1. LE CATALOGUE GLOBAL (FOOD) ---
const foodSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    barcode: { type: String, unique: true, sparse: true, default: null },
    calories100g: { type: Number, required: true, default: 0 },
    proteins100g: { type: Number, default: 0 },
    carbs100g: { type: Number, default: 0 },
    fats100g: { type: Number, default: 0 },
    fiber100g: { type: Number, default: 0 },
    salt100g: { type: Number, default: 0 },
    potassium100g: { type: Number, default: 0 }, // ← AJOUT (en mg)
    isFavorite: { type: Boolean, default: false },

    // ← AJOUT : provenance de la donnée
    source: {
        type: String,
        enum: ['ciqual', 'openfoodfacts', 'user'],
        default: 'user'
    },
    ciqualCode: { type: String, default: null } // ID Ciqual pour traçabilité
}, { timestamps: true });

// --- 2. LE JOURNAL DES REPAS (MEAL) ---
const mealSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: { type: Date, required: true, default: Date.now },
    title: { type: String, trim: true },
    description: { type: String, trim: true, default: "" },
    type: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: true
    },
    items: [{
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        calories: { type: Number, required: true },
        proteins: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 },
        salt: { type: Number, default: 0 },
        potassium: { type: Number, default: 0 } // ← AJOUT
    }],
    totals: {
        calories: { type: Number, default: 0 },
        proteins: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 },
        salt: { type: Number, default: 0 },
        potassium: { type: Number, default: 0 } // ← AJOUT
    }
}, { timestamps: true });

const Food = mongoose.model('Food', foodSchema);
const Meal = mongoose.model('Meal', mealSchema);

module.exports = { Food, Meal };