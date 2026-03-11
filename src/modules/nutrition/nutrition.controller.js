const nutritionService = require('./nutrition.service');

const nutritionController = {
    // --- GESTION DES REPAS (MEALS) ---

    addMeal: async (req, res) => {
        try {
            const meal = await nutritionService.createMeal(req.user.id, req.body);
            res.status(201).json(meal);
        } catch (error) {
            res.status(400).json({ message: "Erreur lors de la création du repas", error: error.message });
        }
    },

    getUserHistory: async (req, res) => {
        try {
            const meals = await nutritionService.getAllUserMeals(req.user.id);
            res.json(meals);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération de l'historique" });
        }
    },

    getDailyLog: async (req, res) => {
        try {
            const dateParam = req.query.date ? new Date(req.query.date) : new Date();
            
            const meals = await nutritionService.getUserMealsByDate(req.user.id, dateParam);
            res.json(meals);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération du journal" });
        }
    },

    updateMeal: async (req, res) => {
        try {
            const meal = await nutritionService.updateMeal(req.params.id, req.user.id, req.body);
            if (!meal) return res.status(404).json({ message: "Repas non trouvé ou non autorisé" });
            res.json(meal);
        } catch (error) {
            res.status(400).json({ message: "Erreur lors de la modification", error: error.message });
        }
    },

    deleteMeal: async (req, res) => {
        try {
            const result = await nutritionService.deleteMeal(req.params.id, req.user.id);
            if (!result) return res.status(404).json({ message: "Repas introuvable" });
            res.json({ message: "Repas supprimé avec succès" });
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la suppression" });
        }
    },

    // --- GESTION DU CATALOGUE (FOODS) ---

    // Créer un nouvel aliment
    createFood: async (req, res) => {
        try {
            const food = await nutritionService.getOrCreateFood(req.body);
            res.status(201).json(food);
        } catch (error) {
            res.status(400).json({ message: "Erreur lors de la création de l'aliment", error: error.message });
        }
    },

    // Récupérer tous les aliments (Catalogue complet)
    getAllFood: async (req, res) => {
        try {
            const foods = await nutritionService.getAllFoods();
            res.json(foods);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération du catalogue" });
        }
    },

    // Récupérer un aliment spécifique par son ID
    getFood: async (req, res) => {
        try {
            const food = await nutritionService.getFoodById(req.params.id);
            if (!food) return res.status(404).json({ message: "Aliment introuvable" });
            res.json(food);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération de l'aliment" });
        }
    },

    // Modifier un aliment
    editFood: async (req, res) => {
        try {
            const food = await nutritionService.updateFood(req.params.id, req.body);
            if (!food) return res.status(404).json({ message: "Aliment introuvable" });
            res.json(food);
        } catch (error) {
            res.status(400).json({ message: "Erreur lors de la modification de l'aliment", error: error.message });
        }
    },

    // Supprimer un aliment du catalogue
    deleteFood: async (req, res) => {
        try {
            const result = await nutritionService.deleteFood(req.params.id);
            if (!result) return res.status(404).json({ message: "Aliment introuvable" });
            res.json({ message: "Aliment supprimé du catalogue" });
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la suppression de l'aliment" });
        }
    },

    // Recherche d'aliments (Existante)
    searchFood: async (req, res) => {
        try {
            const results = await nutritionService.searchFood(req.query.q);
            res.json(results);
        } catch (error) {
            res.status(500).json({ message: "Erreur de recherche" });
        }
    },

    getFavorites: async (req, res) => {
        try {
            const favorites = await nutritionService.getFavoriteFoods();
            res.json(favorites);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération des favoris" });
        }
    },

    // Basculer le statut favori
    toggleFavorite: async (req, res) => {
        try {
            const food = await nutritionService.toggleFoodFavorite(req.params.id);
            if (!food) return res.status(404).json({ message: "Aliment introuvable" });
            res.json(food);
        } catch (error) {
            res.status(400).json({ message: "Erreur lors de la modification du favori" });
        }
    },

    getRecents: async (req, res) => {
        try {
            const recents = await nutritionService.getRecentFoods(req.user.id);
            res.json(recents);
        } catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération des récents" });
        }
    }
};

module.exports = nutritionController;