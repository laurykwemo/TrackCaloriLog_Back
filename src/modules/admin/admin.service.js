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
        } catch (error) {
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
            if (!user) {
                const error = new Error("Utilisateur introuvable");
                error.status = 404;
                throw error;
            }
            return user;
        } catch (error) {
            console.error("Erreur lors du changement de rôle :", error);
            throw error;
        }
    },

    toggleActiveStatus: async (userId) => {
        try {
            const user = await User.findById(userId);
            if (!user) return null;

            user.isActive = !user.isActive;
            return await user.save();
        } catch (error) {
            throw error;
        }
    },

    getStats: async () => {
        const totalUsers = await User.countDocuments();
        const admins = await User.countDocuments({ role: 'admin' });
        const standardUsers = await User.countDocuments({ role: 'user' });

        return { totalUsers, admins, standardUsers };
    },

    banUser: async (userId, banExpiry, reason) => { // Ajout de reason
        try {
            const userToBan = await User.findById(userId);
            if (!userToBan) throw new Error("Utilisateur introuvable");

            if (userToBan.role === 'admin') {
                throw new Error("Impossible de bannir un compte administrateur.");
            }

            userToBan.isBanned = true;
            userToBan.banExpires = banExpiry;
            userToBan.banReason = reason; // Sauvegarde de la raison
            userToBan.isActive = false;

            return await userToBan.save();
        } catch (error) {
            console.error("Erreur service banUser:", error.message);
            throw error;
        }
    },

    unbanUser: async (userId) => {
        try {
            const user = await User.findByIdAndUpdate(userId, {
                isBanned: false,
                banExpires: null,
                banReason: "",
                isActive: true
            }, { new: true });
            
            if (!user) throw new Error("Utilisateur introuvable");
            return user;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = adminService;