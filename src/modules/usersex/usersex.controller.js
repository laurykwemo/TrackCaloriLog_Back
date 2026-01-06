const userSexService = require('./usersex.service');

const userSexController = {
    handleSexCreation: async (req, res) => {
        try {
            const usersexData = req.body;

            // Validation minimale du body
            if (!usersexData.label || usersexData.bmrCoef === undefined || !usersexData.description) {
                return res.status(400).json({ message: "Champs obligatoires manquants" });
            }

            const newUserSex = await userSexService.createSex(usersexData);

            res.status(201).json({
                message: 'Sexe créé avec succès',
                sex: newUserSex
            });
        } catch (error) {
            console.error(error.message);
            res.status(400).json({
                message: error.message || "Une erreur est survenue lors de la création."
            });
        }
    },

    handleAllSexes: async (req, res) => {
        try {
            const sexes = await userSexService.getAllSexes();
            res.status(200).json(sexes);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Erreur interne du serveur lors de la récupération des sexes."
            });
        }
    }
};

module.exports = userSexController;
