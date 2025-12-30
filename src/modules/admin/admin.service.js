const User = require('../user/user.model');
const bcrypt = require('bcrypt');
const deletedUser = require('../deleteduser/deleteduser.model');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const adminService = {
    getAllUsers: async () => {
        try {
            const users = await User.find().populate('sex', 'label').select('-password -deletedAt -updatedAt -__v');
            return users;
        } catch (error){
            console.error("Erreur lors de la récupération de tous les users :", error);
            throw error;
        }
    },
    updateUserRole: async (userId, newRole) => {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { role: newRole },
                { new: true }
            );
            return user;
        } catch (error) {
            console.error("Erreur lors du changement de rôle :", error);
            throw error;
        }
    },
    /*toggleUserActiveStatus: async (userId, status) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { isActive: status },
                { new: true }
            );
            return updatedUser;
        } catch (error) {
            console.error("Erreur lors du changement de statut :", error);
            throw error;
        }
    },*/
    toggleActiveStatus: async (userId) => {
        const user = await User.findById(userId);
        user.isActive = !user.isActive;
        await user.save();
        return user;
    },
    getStats: async () => {
        const totalUsers = await User.countDocuments();
        const admins = await User.countDocuments({ role: 'admin' });
        const standardUsers = await User.countDocuments({ role: 'user' });

        return { totalUsers, admins, standardUsers };
    }
}

module.exports = adminService;