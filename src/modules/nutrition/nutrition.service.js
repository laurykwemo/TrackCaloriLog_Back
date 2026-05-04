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

    /**
     * Centralise le calcul des totaux d'un repas.
     * On reçoit les `items` avec leurs valeurs DÉJÀ calculées selon la quantité
     * (le frontend a fait calories100g * quantity / 100 par exemple).
     *
     * NOTE: salt est en GRAMMES, potassium en MILLIGRAMMES.
     * Pour le ratio Na/K, on convertira côté frontend.
     */
    calculateTotals: (items) => {
        let totals = {
            calories: 0, proteins: 0, carbs: 0, fats: 0,
            fiber: 0, salt: 0, potassium: 0
        };

        const updatedItems = items.map(item => {
            const calculated = {
                calories: Math.round(item.calories || 0),
                proteins: Number((item.proteins || 0).toFixed(1)),
                carbs: Number((item.carbs || 0).toFixed(1)),
                fats: Number((item.fats || 0).toFixed(1)),
                fiber: Number((item.fiber || 0).toFixed(1)),
                salt: Number((item.salt || 0).toFixed(2)),       // 2 décimales (g, valeurs faibles)
                potassium: Math.round(item.potassium || 0)        // mg, entier suffisant
            };

            Object.keys(totals).forEach(key => totals[key] += calculated[key]);

            return {
                foodId: item.foodId,
                name: item.name,
                quantity: item.quantity,
                ...calculated
            };
        });

        // Arrondi final
        totals.calories = Math.round(totals.calories);
        totals.proteins = Number(totals.proteins.toFixed(1));
        totals.carbs = Number(totals.carbs.toFixed(1));
        totals.fats = Number(totals.fats.toFixed(1));
        totals.fiber = Number(totals.fiber.toFixed(1));
        totals.salt = Number(totals.salt.toFixed(2));
        totals.potassium = Math.round(totals.potassium);

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

    getUserMealsByDate: async (userId, date) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);

        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        return await Meal.find({
            userId,
            date: { $gte: start, $lte: end }
        }).sort({ date: 1 });
    },

    getFavoriteFoods: async () => {
        return await Food.find({ isFavorite: true }).sort({ name: 1 });
    },

    toggleFoodFavorite: async (id) => {
        const food = await Food.findById(id);
        if (!food) return null;
        food.isFavorite = !food.isFavorite;
        return await food.save();
    },

    getRecentFoods: async (userId) => {
        const lastMeals = await Meal.find({ userId })
            .sort({ date: -1 })
            .limit(5);

        const allItems = lastMeals.flatMap(meal => meal.items);

        const uniqueFoods = [];
        const seen = new Set();

        for (const item of allItems) {
            if (!seen.has(item.name)) {
                seen.add(item.name);
                uniqueFoods.push({
                    name: item.name,
                    calories100g: item.calories,
                    proteins100g: item.proteins,
                    carbs100g: item.carbs,
                    fats100g: item.fats,
                    fiber100g: item.fiber,
                    salt100g: item.salt,
                    potassium100g: item.potassium // ← AJOUT
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