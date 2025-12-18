const userService = require('./user.service');

const userController = {
    handleUserCreation: async (req, res) => {
        try{
            const userData = req.body;

            const newUserSansMdp = await userService.createUser(userData);
            res.status(201).json({
                message: 'Utilisateur crée avec succès',
                user: newUserSansMdp
                
            });
        }catch(error){
            console.error(error.message);
            res.status(400).json({
                message: error.message || "Une erreur est survenue lors de la création."
            });
        }
    },
    handleAllUsers: async (req, res) => {
        try {
            const users = await userService.getAllUsers();
            res.status(200).json(users);
        } catch (error){
            console.error(error);
            res.status(500).json({message: "Erreur interne du serveur lors de la récupération des utilisateurs."})
        }
    },
    editUser: async (req, res) => { 
        try {
            const updatedUser = await userService.editUser(req.params.id, req.body);
            
            if (!updatedUser) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            res.json(updatedUser);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la modification", error });
        }
    },
    deletedUser: async (req, res) => {
        try {
        const deletedUser = await userService.deleteUser(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.json({ message: "Utilisateur supprimé avec succès", deletedUser });
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la suppression", error });
        }
    },
    updateUserStatus: async (req, res) => {
        try {
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    message: "isActive doit être un booléen"
                });
            }

            const user = await userService.updateStatus(
                req.params.id,
                isActive
            );

            if (!user) {
                return res.status(404).json({
                    message: "Utilisateur introuvable"
                });
            }

            res.status(200).json({
                message: "Statut utilisateur mis à jour",
                user
            });
        } catch (error) {
            res.status(500).json({
                message: "Erreur lors de la mise à jour du statut"
            });
        }
    }
}

module.exports = userController;