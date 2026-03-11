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

            // 1. Validation des rôles autorisés
            const allowedRoles = ['admin', 'user'];
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({ message: "Rôle invalide." });
            }

            // 2. SÉCURITÉ : Empêcher un admin de modifier son propre rôle 
            // (pour éviter de se bloquer l'accès au panel)
            if (req.user.id === id) {
                return res.status(403).json({ message: "Vous ne pouvez pas modifier votre propre rôle." });
            }

            // 3. Appel au service avec uniquement la donnée filtrée
            const updatedUser = await adminService.updateUserRole(id, role);
            
            if (!updatedUser) {
                return res.status(404).json({ message: "Utilisateur introuvable." });
            }

            // 4. On renvoie une réponse propre (sans mot de passe)
            res.json({
                message: "Rôle mis à jour avec succès",
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    role: updatedUser.role
                }
            });

        } catch (error) {
            console.error("Erreur updateUserRole:", error);
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
        // 1. Log immédiat pour voir si on entre dans la fonction
        console.log("--- DEBUG COMPLET ---");
        console.log("Headers:", req.headers['content-type']);
        console.log("Param ID:", req.params.id);
        console.log("Raw Body:", req.body);
        try {
            const { id } = req.params;
            // On récupère 'reason' et on vérifie 'banUntil' (le nom envoyé par le fetch)
            const { durationInDays, endDate, banUntil, reason } = req.body; 

            // 1. Sécurité : Vérifier si la raison est présente
            if (!reason || reason.trim().length === 0) {
                return res.status(400).json({ message: "La raison du bannissement est obligatoire." });
            }

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "ID utilisateur invalide." });
            }

            // ... (ton code de vérification admin et calcul de date) ...
            let banExpiry = null;
            const finalDate = banUntil || endDate;

            if (finalDate) {
                banExpiry = new Date(finalDate);
            } else if (durationInDays) {
                banExpiry = new Date();
                banExpiry.setDate(banExpiry.getDate() + parseInt(durationInDays));
            }

            // 2. IMPORTANT : On passe bien les 3 arguments au service
            const user = await adminService.banUser(id, banExpiry, reason);

            res.status(200).json({
                message: `Utilisateur banni jusqu'au ${banExpiry ? banExpiry.toLocaleString() : 'définitivement'}.`,
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