const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { isAuthenticated, isAdmin } = require('../../middlewares/authMiddleware');

// --- PROTECTION GLOBALE ---
// Toutes les routes ci-dessous nécessitent d'être connecté ET admin
router.use(isAuthenticated, isAdmin);

// Récupérer les 20 dernières alertes
router.get('/', notificationController.getHistory);

// Marquer une alerte comme lue
router.patch('/:id/read', notificationController.markAsRead);

// Supprimer une alerte (facultatif)
router.delete('/:id', notificationController.deleteAlert);

module.exports = router;