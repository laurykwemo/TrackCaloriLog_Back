const userService = require('./user.service');
const mongoose = require('mongoose');

const userController = {
    handleUserCreation: async (req, res) => {
        try{
            const userData = req.body;

            const newUserSansMdp = await userService.createUser(userData);
            res.status(201).json({
                message: 'Utilisateur crée avec succès',
                user: newUserSansMdp
                
            });
        }catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
                    // Si c'est une erreur de validation (âge, format email, etc.)
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            // Si c'est un email déjà existant (doublon)
            if (error.code === 11000) {
                return res.status(400).json({ message: "Cet email est déjà utilisé." });
            }
            // Si l'ID est mal formé (CastError)
            if (error.name === 'CastError') {
                return res.status(400).json({ message: "Format d'ID invalide" });
            }
            // Erreur générique
            res.status(500).json({ message: "Erreur serveur interne" });
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
    getUser: async (req, res) => {
        try {
            const user = await userService.getUser(req.params.id);
            if (!user) return res.status(404).json({ message: "User not found" });
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(404).json({ message: "Utilisateur non trouvé (ID invalide)" });
            }
            res.status(200).json(user);
        } catch (error) {
            // Gérer le cas où l'ID n'est pas un ObjectId valide (ex: /api/existe-pas)
            if (error.name === 'CastError') {
                return res.status(400).json({ message: "Format d'ID invalide" });
            }
            res.status(500).json({ message: error.message });
        }
    },
    // Dans ton userController.js
    editUser: async (req, res) => {
        try {
            const idToUpdate = req.params.id;
            
            // On simule une autorisation totale pour le test
            const isActuallyAdmin = true; 

            // On appelle le service directement
            const updatedUser = await userService.editUser(idToUpdate, req.body, isActuallyAdmin);

            if (!updatedUser) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            res.status(200).json(updatedUser);
        } catch (error) {
            // ... garde ton bloc catch actuel
            res.status(500).json({ message: error.message });
        }
    },
    deletedUser: async (req, res) => {

        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: "Format d'ID invalide" });
            }
            const deletedUser = await userService.deleteUser(req.params.id);

            if (!deletedUser) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            res.json({ message: "Utilisateur supprimé avec succès", deletedUser });
        } catch (error) {
            console.error("Erreur lors de la suppression :", error.message);
            res.status(error.status || 500).json({
                message: error.message || "Erreur serveur"
            });
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
    },
    updateDailyGoal: async (req, res) => {
        try {
            const { dailyCalorieGoal } = req.body;
            
            if (dailyCalorieGoal === undefined || isNaN(dailyCalorieGoal)) {
                return res.status(400).json({ message: "Un objectif calorique valide est requis" });
            }

            const user = await userService.updateDailyGoal(req.params.id, dailyCalorieGoal);

            if (!user) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            res.json({ message: "Objectif mis à jour", dailyCalorieGoal: user.dailyCalorieGoal });
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la mise à jour de l'objectif" });
        }
    },
    updateDailyProtGoal: async (req, res) => {
        try {
            const { dailyProteinGoal } = req.body;
            
            if (dailyProteinGoal === undefined || isNaN(dailyProteinGoal)) {
                return res.status(400).json({ message: "Un objectif Proteique valide est requis" });
            }

            const user = await userService.updateDailyProtGoal(req.params.id, dailyProteinGoal);

            if (!user) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            res.json({ message: "Objectif mis à jour", dailyProteinGoal: user.dailyProteinGoal });
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la mise à jour de l'objectif" });
        }
    }
}

module.exports = userController;