const Activity = require('./activity.model');

const activityService = {
    getDailyBurnedCalories: async (userId, date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const dailyActivity = await Activity.aggregate([
            { $match: { 
                userId: new mongoose.Types.ObjectId(userId), 
                date: { $gte: startOfDay, $lte: endOfDay } 
            }},
            { $group: { 
                _id: null, 
                totalBurned: { $sum: "$caloriesBurned" } 
            }}
        ]);

        return dailyActivity.length > 0 ? dailyActivity[0].totalBurned : 0;
    }
};

module.exports = activityService;