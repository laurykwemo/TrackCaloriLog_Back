const express = require('express');
const router = express.Router();
const activityController = require('./activity.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// Toutes les routes d'activité nécessitent d'être connecté
router.use(authMiddleware.isAuthenticated);

// Route pour recevoir les données de la montre (Webhook ou App mobile)
router.post('/sync', activityController.syncActivity);

// Route pour récupérer le total des calories brûlées du jour
router.get('/daily', activityController.getDailyReport);

module.exports = router;