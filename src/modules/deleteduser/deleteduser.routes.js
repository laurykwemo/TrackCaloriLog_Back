const express = require('express');
const router = express.Router();
const deletedUserController = require('./deleteduser.controller');
const { isAuthenticated, isAdmin } = require('../../middlewares/authMiddleware');

// Appliquer la protection Admin à TOUTES les routes de ce fichier
router.use(isAuthenticated, isAdmin);

// 1. Routes spécifiques (SANS :id ou avec un chemin long)
// Correspond à GET /api/deletedusers (si préfixé ainsi dans app.js)
router.get('/', deletedUserController.getAllDeletedUsers);

// 2. Actions spécifiques (Avant le :id générique)
router.post('/restore/:id', deletedUserController.restoreDeletedUser);

// 3. Routes génériques avec :id (En dernier)
router.get('/:id', deletedUserController.getDeletedUserById);
router.put('/:id', deletedUserController.editUser);
router.delete('/:id', deletedUserController.deletePermanently);

module.exports = router;