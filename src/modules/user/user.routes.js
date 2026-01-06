const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { isAuthenticated } = require('../../middlewares/authMiddleware');

// --- Routes Publiques ---
router.post('/addusers', userController.handleUserCreation);

// --- Routes Protégées (nécessitent d'être connecté) ---
router.use(isAuthenticated); 

// 1. Routes spécifiques d'abord
router.get('/AllUsers', userController.handleAllUsers);

// 2. Routes avec paramètres (Toujours en dernier)
router.put('/:id/status', userController.updateUserStatus);
router.put('/:id', userController.editUser);
router.get('/:id', userController.getUser);
router.delete('/:id', userController.deletedUser);

module.exports = router;