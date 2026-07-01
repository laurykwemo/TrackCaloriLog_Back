const userService = require('../user/user.service');
const User = require('../user/user.model');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const authService = {
    register: async (data) => {
        return userService.createUser(data);
    },
    login: async (email, password) => {
        try {
            const user = await userService.findByEmail(email);
            if (!user) throw new Error('Identifiants incorrects');

            if (user.lockUntil && user.lockUntil > Date.now()) {
                throw new Error(`Compte bloqué. Réessayez plus tard.`);
            }

            if (!user.isEmailVerified) {
                throw new Error("Veuillez vérifier votre boîte mail pour valider votre compte.");
            }

            // --- LOGIQUE DE BAN : vérifiée AVANT isActive ---
            // (car bannir un user met isActive=false, on doit d'abord lever le ban expiré)
            if (user.isBanned) {
                const now = new Date();
                const banEnd = user.banExpires ? new Date(user.banExpires) : null;

                if (!banEnd || banEnd > now) {
                    // Ban encore actif → on bloque
                    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
                    const msg = banEnd 
                        ? `Votre compte est banni jusqu'au : ${banEnd.toLocaleString('fr-FR', dateOptions)}.`
                        : "Votre compte est banni définitivement.";
                    throw new Error(msg);
                }

                if (banEnd && banEnd <= now) {
                    user.isBanned = false;
                    user.banExpires = null;
                    user.isActive = true; // <--- On le rend actif pour qu'il puisse passer les vérifications suivantes
                    await user.save();
                }

                // Ban expiré → on nettoie immédiatement en base
                user.isBanned = false;
                user.banExpires = null;
                user.banReason = null;
                user.isActive = true;
                await user.save();
                console.log(`[AUTO-UNBAN] Ban expiré levé au login pour : ${user.email}`);
            }

            // Check isActive APRÈS la gestion du ban
            if (!user.isActive) {
                throw new Error("Votre compte a été suspendu. Contactez le support.");
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                user.loginAttempts += 1;
                if (user.loginAttempts >= 5) {
                    user.lockUntil = Date.now() + 1 * 60 * 60 * 1000;
                    await user.save();
                    throw new Error("Trop de tentatives. Compte bloqué pour 1h.");
                }
                await user.save();
                throw new Error("Identifiants incorrects"); 
            }

            // Succès
            user.loginAttempts = 0;
            user.lockUntil = undefined;
            user.lastLogin = Date.now();
            // On ne fait pas encore le save() ici, on laisse le controller le faire 
            // (ou on le fait ici, mais le controller gère le nettoyage du ban)

            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            return { token, user }; // Retourne l'objet user complet pour le controller

        } catch (error) {
            throw error;
        }
    },
    verifyUser: async (token) => {
        // 1. Trouver l'utilisateur avec ce token spécifique
        const user = await User.findOne({ emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() } });

        if (!user) return null;

        // 2. Mettre à jour les champs
        user.isActive = true;
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined; // On supprime le token car il a servi
        user.emailVerificationExpires = undefined;
        
        await user.save();
        return user;
    },
    resendVerificationEmail: async (email) => {
        const user = await User.findOne({ email });

        if (!user) throw new Error("Aucun utilisateur trouvé avec cet email.");
        if (user.isEmailVerified) throw new Error("Cet email est déjà vérifié.");

        // Générer un nouveau token unique
        const newToken = crypto.randomBytes(32).toString('hex');
        
        // Mettre à jour l'utilisateur
        user.emailVerificationToken = newToken;
        // Optionnel : tu peux aussi mettre à jour une date d'expiration ici
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        return user; // On retourne l'utilisateur pour envoyer le mail dans le controller
    },
        // À ajouter dans authService
    forgotPassword: async (email) => {
        const user = await User.findOne({ email });
        if (!user) throw new Error("Aucun utilisateur avec cet email.");

        // 1. Générer un token unique
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // 2. Sauvegarder dans la base (expire dans 1h)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
        
        await user.save();
        return { user, resetToken };
    },

    resetPassword: async (token, newPassword) => {
        // 1. Trouver l'utilisateur avec le token valide et non expiré
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) throw new Error("Le lien est invalide ou a expiré.");

        // 2. Hasher le nouveau mot de passe et nettoyer les champs de reset
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        return user;
    }
}

module.exports = authService;