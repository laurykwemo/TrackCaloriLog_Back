const DeletedUser = require('./deleteduser.model');
const User = require('../user/user.model');

const deleteduserService = {
    restoreDeletedUser: async (deletedUserId) => {
        try {
            // On récupère l'user supprimé
            const deletedUser = await DeletedUser.findById(deletedUserId);
            if (!deletedUser) {
                throw new Error("Utilisateur introuvable dans les supprimés.");
            }

            // On le recrée dans la vraie table User
            const restoredUser = new User(deletedUser.toObject());
            await restoredUser.save();

            // On supprime l'entrée dans DeletedUser
            await DeletedUser.findByIdAndDelete(deletedUserId);

            return restoredUser;
        } catch (error) {
            console.error("Erreur lors de la restauration :", error);
            throw error;
        }
    },
    deletePermanently: async (userId) => {
        try {
            const deletedUser = await DeletedUser.deleteOne({_id: userId});
            return deletedUser;
        } catch(error){
            console.error("Erreur lors de la suppression :", error);
            throw error;
        }
    },
    getAllDeletedUsers: async () => {
        try{
            const deletedUsers = await DeletedUser.find().select('-password');
            return deletedUsers;
        } catch (error){
            console.error("Erreur lors de la récupération de tous les deletedusers :", error);
            throw error;
        }
    },
    getDeletedUserById: async (id) => {
        try {
            return await DeletedUser.findById(id);
        } catch (error) {
            console.error("Erreur service getDeletedUserById :", error);
            throw error;
        }
    },
    editUser: async (userId, userData) => {
        try {
            const updatedUser = await DeletedUser.findByIdAndUpdate(
                userId,
                userData,
                { new: true }
            );
            return updatedUser;
        } catch (error) {   // <-- CORRECTION
            console.error("Erreur lors de la modification :", error);
            throw error;
        }
    }
}


module.exports = deleteduserService;