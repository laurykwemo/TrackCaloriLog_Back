const UserSex = require("./usersex.model");

const usersexService = {
    createSex: async (data) => {
        try {
            // Utilise .lean() pour être sûr de récupérer un objet JS simple pour le calcul
            const lastSex = await UserSex.findOne().sort({ _id: -1 }).lean();
            const nextId = (lastSex && lastSex._id) ? lastSex._id + 1 : 1;

            const newUserSex = new UserSex({
                _id: nextId,
                label: data.label,
                bmrCoef: data.bmrCoef,
                description: data.description
            });

            const savedSex = await newUserSex.save();
            return savedSex.toObject();
        } catch (error) {
            console.error("Erreur service createSex:", error.message);
            throw error; 
        }
    },

    getAllSexes: async () => {
        try {
            return await UserSex.find();
        } catch (error) {
            console.error("Erreur service getAllSexes:", error.message);
            throw error;
        }
    }
};

module.exports = usersexService;