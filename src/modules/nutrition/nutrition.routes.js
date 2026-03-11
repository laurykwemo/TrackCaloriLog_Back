const express = require('express');
const router = express.Router();
const nutritionController = require('./nutrition.controller');
const { isAuthenticated } = require('../../middlewares/authMiddleware');

// Sécurité : Il faut être connecté pour accéder à la nutrition
router.use(isAuthenticated);

/**
 * ROUTES POUR LES REPAS (MEALS)
 */
// GET /api/nutrition/meals (Historique complet)
router.get('/meals', nutritionController.getUserHistory);

// GET /api/nutrition/meals/log?date=YYYY-MM-DD (Journal quotidien)
router.get('/meals/log', nutritionController.getDailyLog);

router.get('/meals/log/all', nutritionController.getUserHistory);

// POST /api/nutrition/meals (Ajouter un repas)
router.post('/meals', nutritionController.addMeal);

// PUT /api/nutrition/meals/:id (Modifier un repas)
router.put('/meals/:id', nutritionController.updateMeal);

// DELETE /api/nutrition/meals/:id (Supprimer un repas)
router.delete('/meals/:id', nutritionController.deleteMeal);

/**
 * ROUTES POUR LE CATALOGUE (FOODS)
 */
// GET /api/nutrition/food/search?q=banane
router.get('/food/search', nutritionController.searchFood);
router.post('/addFood', nutritionController.createFood);
router.get('/allFood', nutritionController.getAllFood);
router.get('/foods/favorites', nutritionController.getFavorites);
router.get('/meals/recents', nutritionController.getRecents);

// Basculer l'étoile (Favori / Non-Favori)
router.patch('/foods/:id/favorite', nutritionController.toggleFavorite);

module.exports = router;