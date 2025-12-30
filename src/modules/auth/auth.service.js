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
            // 1. Chercher l'utilisateur
            const user = await userService.findByEmail(email);

            if (!user) {
                throw new Error('Identifiants incorrects');
            }

            // 2. Vérifier si le compte est verrouillé temporellement
            if (user.lockUntil && user.lockUntil > Date.now()) {
                throw new Error(`Compte bloqué. Réessayez plus tard.`);
            }

            // 3. Vérifier si l'email est validé
            if (!user.isEmailVerified) {
                throw new Error("Veuillez vérifier votre boîte mail pour valider votre compte.");
            }

            if (!user.isActive) {
                throw new Error("Votre compte a été suspendu. Contactez le support.");
            }

            // 4. Comparer le mot de passe
            const isValid = await bcrypt.compare(password, user.password);

            if (!isValid) {
                // C'est ICI qu'on gère l'échec
                user.loginAttempts += 1;
                
                if (user.loginAttempts >= 5) {
                    user.lockUntil = Date.now() + 1 * 60 * 60 * 1000; // Bloqué 1h
                    await user.save();
                    throw new Error("Trop de tentatives. Compte bloqué pour 1h.");
                }

                await user.save(); // On sauvegarde l'incrémentation
                throw new Error("Identifiants incorrects"); 
            }

            // 5. SI TOUT EST OK : Réinitialisation et Token
            user.loginAttempts = 0;
            user.lockUntil = undefined;
            user.lastLogin = Date.now();
            await user.save();

            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            
            return { 
                token, 
                user: { id: user._id, name: user.name, email: user.email, role: user.role} 
            };

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