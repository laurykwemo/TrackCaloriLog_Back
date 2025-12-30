const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const deleteduserController = require('../deleteduser/deleteduser.controller')
const authMiddleware = require('../../middlewares/authMiddleware');

// Route réservée aux admins pour modifier un rôle
router.put('/updateRole/:id', authMiddleware.isAuthenticated, 
    authMiddleware.isAdmin, adminController.updateUserRole);

//router.patch('/toggleActive/:id', isAdmin, adminController.toggleUserActiveStatus);
router.patch('/toggleActive/:id', 
    authMiddleware.isAuthenticated, 
    authMiddleware.isAdmin, 
    adminController.toggleActiveStatus
);

// Toutes les routes admin doivent être protégées
//router.use(isAuthenticated, isAdmin);

// Récupérer tous les utilisateurs
router.get('/users', adminController.getAllUsers);

// Modifier le rôle d’un user
router.put('/users/:id/role', adminController.updateUserRole);

// Supprimer un user définitivement
router.delete('/users/:id', deleteduserController.deletePermanently);

// Statistiques générales
router.get('/stats', adminController.getStats);

module.exports = router;
