const Activity = require('./activity.model'); // Assure-toi que le chemin est correct
const User = require('../user/user.model'); // Import nécessaire pour trouver l'utilisateur
const activityService = require('./activity.service'); // Correction du nom (tu avais "nactivity")

const activityController = {
    // --- MÉTHODE AJOUTÉE : Reçoit les données de la montre ---
    syncActivity: async (req, res) => {
        try {
            const { caloriesBurned, source, date, externalId } = req.body;
            const userId = req.user.id;

            // Utilisation de findOneAndUpdate avec upsert:true 
            // pour mettre à jour si l'ID existe déjà, sinon créer.
            const activity = await Activity.findOneAndUpdate(
                { externalId: externalId, userId: userId }, 
                {
                    userId,
                    caloriesBurned: parseFloat(caloriesBurned),
                    source: source || 'Smartwatch',
                    date: date ? new Date(date) : new Date(),
                    externalId: externalId
                },
                { upsert: true, new: true }
            );

            res.status(200).json({ 
                message: "Activité synchronisée avec succès", 
                activity 
            });
        } catch (error) {
            console.error("Erreur syncActivity:", error);
            res.status(500).json({ message: "Erreur lors de la synchronisation" });
        }
    },

    // Ta méthode existante renommée pour correspondre à ta route router.get('/daily', ...)
    getDailyReport: async (req, res) => {
        try {
            const userId = req.user.id;
            const date = req.query.date || new Date();

            const user = await User.findById(userId);
            const baseGoal = user ? user.dailyCalorieGoal : 2000;

            const extraCals = await activityService.getDailyBurnedCalories(userId, date);

            res.json({
                baseGoal: baseGoal,
                extraCals: extraCals,
                adjustedGoal: baseGoal + extraCals
            });
        } catch (error) {
            console.error("Erreur getDailyReport:", error);
            res.status(500).json({ message: "Erreur calcul report" });
        }
    }
};

module.exports = activityController;