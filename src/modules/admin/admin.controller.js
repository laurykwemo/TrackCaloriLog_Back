const adminService = require('./admin.service');

const adminController = {

    // Liste des utilisateurs
    getAllUsers: async (req, res) => {
        try {
            const users = await adminService.getAllUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération des users", error });
        }
    },

    // Modifier le rôle
    updateUserRole: async (req, res) => {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!['Admin', 'User'].includes(role)) {
                return res.status(400).json({ message: "Rôle invalide" });
            }

            const updatedUser = await adminService.updateUserRole(id, role);
            res.json(updatedUser);

        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la modification du rôle", error });
        }
    },
    // Statistiques admin
    getStats: async (req, res) => {
        try {
            const stats = await adminService.getStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération des stats", error });
        }
    },
    /*toggleUserActiveStatus: async (req, res) => {
        try {
            const { id } = req.params;   // ID du user dans l'URL
            const { isActive } = req.body; // Valeur envoyée dans le body (true ou false)

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({ message: "Le champ 'status' doit être un booléen (true ou false)." });
            }

            const updatedUser = await adminService.toggleUserActiveStatus(id, isActive);

            if (!updatedUser) {
                return res.status(404).json({ message: "Utilisateur non trouvé." });
            }

            res.status(200).json({
                message: `Utilisateur ${isActive ? "activé" : "désactivé"} avec succès.`,
                user: updatedUser
            });

        } catch (error) {
            console.error("Erreur dans toggleUserActiveStatus :", error);
            res.status(500).json({ message: "Erreur du serveur lors du changement de statut.", error });
        }
    }*/
    toggleActiveStatus: async (req, res) => {
        try {
            const userId = req.params.id; // On récupère l'ID depuis l'URL

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            // On inverse le statut
            user.isActive = !user.isActive;
            await user.save();

            res.status(200).json({
                message: `Statut mis à jour avec succès ! Now isActive = ${user.isActive}`,
                user
            });

        } catch (error) {
            console.error("Erreur lors du changement de statut :", error);
            res.status(500).json({ message: "Erreur serveur", error });
        }
    }

};

module.exports = adminController;
