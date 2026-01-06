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

// Routes Bannissement
router.post('/users/ban/:id', async (req, res) => {
    try {
        const { banUntil } = req.body; // La date envoyée par le calendrier du front
        const userId = req.params.id;

        const user = await User.findByIdAndUpdate(
            userId, 
            { 
                isBanned: true, 
                banExpires: new Date(banUntil) 
            }, 
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.json({ message: "Utilisateur banni avec succès", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.post('/users/unban/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { 
                isBanned: false, 
                banExpires: null 
            },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.json({ message: "Utilisateur débanni avec succès", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Routes Suppression & Stats
router.delete('/users/:id', deleteduserController.deletePermanently);
router.get('/stats', adminController.getStats);

module.exports = router;