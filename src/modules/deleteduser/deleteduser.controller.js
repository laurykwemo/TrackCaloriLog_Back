const deletedUserService = require('./deleteduser.service');

const deleteduserController = {

    // Récupérer tous les utilisateurs supprimés
    getAllDeletedUsers: async (req, res) => {
        try {
            const deletedUsers = await deletedUserService.getAllDeletedUsers();
            res.status(200).json(deletedUsers);
        } catch (error) {
            res.status(500).json({ error: "Erreur lors du chargement" });
        }
    },

    // Récupérer un utilisateur supprimé par ID
    getDeletedUserById: async (req, res) => {
        try {
            const user = await deletedUserService.getDeletedUserById(req.params.id);
            if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la récupération" });
        }
    },

    // Supprimer définitivement un utilisateur
    deletePermanently: async (req, res) => {
        try {
            const deleted = await deletedUserService.deletePermanently(req.params.id);
            if (!deleted) return res.status(404).json({ message: "Utilisateur non trouvé" });
            res.status(200).json({ message: "Utilisateur supprimé définitivement" });
        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la suppression définitive" });
        }
    },

    // Restaurer un utilisateur supprimé (le remettre dans Users)
    restoreDeletedUser: async (req, res) => {
        try {
            const restoredUser = await deletedUserService.restoreDeletedUser(req.params.id);
            if (!restoredUser) return res.status(404).json({ message: "Utilisateur non trouvé" });
            res.status(200).json({ message: "Utilisateur restauré", user: restoredUser });
        } catch (error) {
            if (error.message === "Utilisateur introuvable dans les supprimés.") {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ error: "Erreur lors de la restauration" });
        }
    },
    editUser: async (req, res) => { 
        try {
            const updatedUser = await deletedUserService.editUser(req.params.id, req.body);
            
            if (!updatedUser) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            // Si le test attend res.body.name, renvoyez updatedUser directement
            // Si le test attend res.body.user.name, renvoyez { user: updatedUser }
            res.status(200).json(updatedUser); 
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la modification", error });
        }
    }
};

module.exports = deleteduserController;


