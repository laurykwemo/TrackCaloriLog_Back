const UserSex = require("./usersex.model");

const usersexService = {
    createSex: async (data) => {
        try{
            const lastSex = await UserSex.findOne({}, {}, { sort: { '_id': -1 } });
            const nextId = lastSex ? lastSex._id + 1 : 1;

            const newUserSex = await UserSex.create({
                _id: nextId,
                label: data.label,
                bmrCoef: data.bmrCoef,
                description: data.description
            });
            const usersexObject = newUserSex.toObject();
            return usersexObject;
        }catch(error){
            console.error("Erreur lors de la création de l'utilisateur dans la BD :", error);
            throw error;
        }
    },
    getAllSexes: async () => {
        try {
            const sexes = await UserSex.find();
            return sexes;
        } catch (error){
            console.error("Erreur lors de la récupération des sexes :", error);
            throw error;
        }
    }
}

module.exports = usersexService;