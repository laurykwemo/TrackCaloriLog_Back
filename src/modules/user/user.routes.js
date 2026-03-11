const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
//const { isAuthenticated } = require('../../middlewares/authMiddleware');

// 1. Routes spécifiques d'abord
router.get('/AllUsers', userController.handleAllUsers);
// --- Routes Publiques ---
router.post('/addusers', userController.handleUserCreation);

// --- Routes Protégées (nécessitent d'être connecté) ---
//router.use(isAuthenticated); 


// 2. Routes avec paramètres (Toujours en dernier)
router.put('/:id/status', userController.updateUserStatus);
router.put('/:id', userController.editUser);
router.put('/:id/daily-goal', userController.updateDailyGoal);
router.put('/:id/dailyprot-goal', userController.updateDailyProtGoal);
router.get('/:id', userController.getUser);
router.delete('/:id', userController.deletedUser);

module.exports = router;