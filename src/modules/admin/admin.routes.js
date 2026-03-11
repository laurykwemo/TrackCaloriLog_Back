const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const deleteduserController = require('../deleteduser/deleteduser.controller');
const { isAuthenticated, isAdmin } = require('../../middlewares/authMiddleware');
const User = require('../user/user.model');

// Appliquer la protection à TOUTES les routes du fichier d'un coup
router.use(isAuthenticated, isAdmin);

// Routes Utilisateurs
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.patch('/toggleActive/:id', adminController.toggleActiveStatus);
router.post('/users/ban/:id', adminController.banUser); 
router.post('/users/unban/:id', adminController.unbanUser);

// Routes Suppression & Stats
router.delete('/users/:id', deleteduserController.deletePermanently);
router.get('/stats', adminController.getStats);

module.exports = router;