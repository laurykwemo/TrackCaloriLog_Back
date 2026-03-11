const { Food, Meal } = require('./nutrition.model');

const nutritionService = {
    // --- FOOD LOGIC ---
    getAllFoods: async () => await Food.find().sort({ name: 1 }),
    
    getFoodById: async (id) => await Food.findById(id),

    getOrCreateFood: async (foodData) => {
        if (foodData.barcode) {
            let existing = await Food.findOne({ barcode: foodData.barcode });
            if (existing) return existing;
        }
        return await Food.create(foodData);
    },

    updateFood: async (id, updateData) => {
        return await Food.findByIdAndUpdate(id, updateData, { new: true });
    },

    deleteFood: async (id) => await Food.findByIdAndDelete(id),

    searchFood: async (query) => {
        return await Food.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { barcode: query }
            ]
        }).limit(10);
    },

    // --- MEAL LOGIC ---
    
    // On centralise le calcul ici pour l'utiliser partout
    calculateTotals: (items) => {
        let totals = { calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0, salt: 0 };
        const updatedItems = items.map(item => {
            //const qtyRatio = item.quantity / 100;
            const calculated = {
                // On s'assure d'utiliser les valeurs 100g fournies par le front ou la DB
                calories: Math.round((item.calories || 0)),
                proteins: Number((item.proteins || 0).toFixed(1)),
                carbs: Number((item.carbs || 0).toFixed(1)),
                fats: Number((item.fats || 0).toFixed(1)),
                fiber: Number((item.fiber || 0).toFixed(1)),
                salt: Number((item.salt || 0).toFixed(1))
            };
            Object.keys(totals).forEach(key => totals[key] += calculated[key]);
            
            // On retourne l'item avec ses macros calculées pour le sous-document 'items'
            return { 
                foodId: item.foodId,
                name: item.name,
                quantity: item.quantity,
                ...calculated 
            };
        });
        
        // On arrondit les totaux finaux
        Object.keys(totals).forEach(key => totals[key] = Number(totals[key].toFixed(1)));
        
        return { items: updatedItems, totals };
    },

    createMeal: async (userId, mealData) => {
        const { items, totals } = nutritionService.calculateTotals(mealData.items);
        
        return await Meal.create({ 
            ...mealData, 
            userId, 
            items, 
            totals,
        });
    },

    updateMeal: async (mealId, userId, updateData) => {
        if (updateData.items) {
            const { items, totals } = nutritionService.calculateTotals(updateData.items);
            updateData.items = items;
            updateData.totals = totals;
        }
        return await Meal.findOneAndUpdate({ _id: mealId, userId }, updateData, { new: true });
    },

    deleteMeal: async (mealId, userId) => {
        return await Meal.findOneAndDelete({ _id: mealId, userId });
    },

    getAllUserMeals: async (userId) => {
        return await Meal.find({ userId }).sort({ date: -1 });
    },

    // nutrition.service.js

    getUserMealsByDate: async (userId, date) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        console.log(`Recherche repas entre ${start.toISOString()} et ${end.toISOString()}`);

        return await Meal.find({
            userId,
            date: { 
                $gte: start, 
                $lte: end 
            }
        }).sort({ date: 1 });
    },

    getFavoriteFoods: async () => {
        return await Food.find({ isFavorite: true }).sort({ name: 1 });
    },

    // Inverser l'état favori d'un aliment
    toggleFoodFavorite: async (id) => {
        const food = await Food.findById(id);
        if (!food) return null;
        food.isFavorite = !food.isFavorite;
        return await food.save();
    },

    getRecentFoods: async (userId) => {
        // 1. Récupérer les 5 derniers repas de l'utilisateur
        const lastMeals = await Meal.find({ userId })
            .sort({ date: -1 })
            .limit(5);

        // 2. Extraire tous les items de ces repas
        const allItems = lastMeals.flatMap(meal => meal.items);

        // 3. Garder uniquement les aliments uniques par leur nom (ou foodId)
        const uniqueFoods = [];
        const seen = new Set();

        for (const item of allItems) {
            if (!seen.has(item.name)) {
                seen.add(item.name);
                uniqueFoods.push({
                    name: item.name,
                    calories100g: item.calories, // On réutilise les macros stockées
                    proteins100g: item.proteins,
                    carbs100g: item.carbs,
                    fats100g: item.fats,
                    fiber100g: item.fiber,
                    salt100g: item.salt
                });
            }
        }

        return uniqueFoods;
    },

    updateDailyGoal: async (userId, newGoal) => {
        try {
            return await User.findByIdAndUpdate(
                userId,
                { dailyCalorieGoal: newGoal },
                { new: true, runValidators: true }
            ).select('-password');
        } catch (error) {
            throw error;
        }
    }
};

module.exports = nutritionService;