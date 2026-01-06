const adminService = require('./admin.service');
const mongoose = require('mongoose');

const adminController = {
    getAllUsers: async (req, res) => {
        try {
            const users = await adminService.getAllUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération des users", error });
        }
    },

    updateUserRole: async (req, res) => {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!['admin', 'user'].includes(role)) {
                return res.status(400).json({ message: "Rôle invalide" });
            }

            const updatedUser = await adminService.updateUserRole(id, role);
            res.json(updatedUser);
        } catch (error) {
            const statusCode = error.status || 500;
            res.status(statusCode).json({ message: error.message || "Erreur serveur" });
        }
    },

    getStats: async (req, res) => {
        try {
            const stats = await adminService.getStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération des stats", error });
        }
    },

    toggleActiveStatus: async (req, res) => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID invalide" });
            }

            const updatedUser = await adminService.toggleActiveStatus(id);
            if (!updatedUser) return res.status(404).json({ message: "Utilisateur non trouvé" });

            res.status(200).json({ message: "Statut mis à jour", user: updatedUser });
        } catch (error) {
            res.status(500).json({ message: "Erreur serveur", error });
        }
    },

    banUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { durationInDays, endDate } = req.body;

            // Vérification de l'ID MongoDB valide
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID utilisateur invalide." });
            }

            // CORRECTION ICI : req.user._id au lieu de req.user.userId
            if (id === req.user._id.toString()) {
                return res.status(400).json({ message: "Vous ne pouvez pas vous bannir vous-même." });
            }

            let banExpiry = null;
            if (endDate) {
                banExpiry = new Date(endDate);
                if (isNaN(banExpiry.getTime())) return res.status(400).json({ message: "Date invalide." });
            } else if (durationInDays) {
                banExpiry = new Date();
                banExpiry.setDate(banExpiry.getDate() + parseInt(durationInDays));
            }

            const user = await adminService.banUser(id, banExpiry);

            res.status(200).json({
                message: banExpiry 
                    ? `Utilisateur banni jusqu'au ${banExpiry.toLocaleDateString('fr-FR')}` 
                    : "Utilisateur banni définitivement.",
                user
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    unbanUser: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await adminService.unbanUser(id);
            res.status(200).json({ message: "L'utilisateur a été débanni.", user });
        } catch (error) {
            res.status(500).json({ message: error.message || "Erreur lors du débannissement." });
        }
    }
};

module.exports = adminController;