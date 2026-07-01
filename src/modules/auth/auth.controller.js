const authService = require('./auth.service');
const User = require('../user/user.model');
const { sendEmail } = require('./email.service'); // ← nouveau service API

const BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://trackcalorilog-back.onrender.com'
    : 'http://localhost:3000';

// Logique d'envoi réutilisable (renvoi de vérification)
const sendEmailLogic = async (email) => {
    const user = await authService.resendVerificationEmail(email);
    const verificationUrl = `${BASE_URL}/trackcalorilog/verify-email?token=${user.emailVerificationToken}`;

    await sendEmail(
        user.email,
        'Vérification de votre compte - Nouveau lien',
        `
            <h1>Validation de votre email</h1>
            <p>Vous avez demandé un nouveau lien de vérification.</p>
            <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px;">
                Vérifier mon compte
            </a>
        `
    );
};

const authController = {

    register: async (req, res) => {
        try {
            const user = await authService.register(req.body);
            console.log('✅ User créé:', user.email);

            // On répond IMMÉDIATEMENT, sans attendre l'envoi du mail
            res.status(201).json({
                message: "Inscription réussie. Un email de vérification a été envoyé.",
                user: { id: user._id, name: user.name, email: user.email }
            });

            // Envoi du mail en arrière-plan (non bloquant)
            const verificationUrl = `${BASE_URL}/trackcalorilog/verify-email?token=${user.emailVerificationToken}`;
            sendEmail(
                user.email,
                'Bienvenue ! Vérification de votre adresse email',
                `<h1>Bienvenue ${user.name} !</h1><p>Cliquez ici pour vérifier votre email:</p><a href="${verificationUrl}">Activer mon compte</a>`
            ).catch(err => {
                console.error('❌ Erreur envoi mail register (non bloquant):', err.message);
            });

        } catch (error) {
            console.error('❌ Erreur register:', error);
            res.status(400).json({ message: error.message || "Erreur lors de l'inscription" });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            const user = result.user;

            await user.save();

            return res.status(200).json({
                token: result.token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role }
            });

        } catch (error) {
            if (error.message.includes("vérifier votre boîte mail")) {
                // Envoi en arrière-plan, jamais bloquant pour la réponse
                sendEmailLogic(req.body.email).catch(err => {
                    console.error('❌ Erreur renvoi mail login (non bloquant):', err.message);
                });

                return res.status(401).json({ message: "Compte non vérifié. Un nouveau lien de vérification a été envoyé." });
            }
            res.status(401).json({ message: error.message });
        }
    },

    verifyEmail: async (req, res) => {
        try {
            const { token } = req.query;
            if (!token) return res.status(400).send("Token manquant.");

            const user = await authService.verifyUser(token);
            if (!user) {
                return res.status(400).send(`
                    <h1>Lien expiré ou invalide</h1>
                    <p>Votre lien de vérification n'est plus valide (max 24h).</p>
                    <p>Veuillez essayer de vous connecter pour recevoir un nouveau lien.</p>
                    <a href="/trackcalorilog/login">Retour au login</a>
                `);
            }

            res.redirect('/trackcalorilog/login?verified=true');
        } catch (error) {
            res.status(500).send("Erreur serveur : " + error.message);
        }
    },

    resendVerification: async (req, res) => {
        try {
            await sendEmailLogic(req.body.email);
            res.status(200).json({ message: "Un nouveau lien a été envoyé." });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    me: async (req, res) => {
        try {
            const idToFind = req.user.userId || req.user.id;

            if (!idToFind) {
                return res.status(401).json({ message: "ID utilisateur absent du token" });
            }

            const user = await User.findById(idToFind).select('-password');

            if (!user) {
                return res.status(404).json({ message: "Utilisateur non trouvé en base" });
            }

            res.status(200).json(user);

        } catch (error) {
            console.error("Erreur détaillée :", error);
            res.status(500).json({ message: "Erreur serveur lors de la récupération du profil" });
        }
    },

    requestPasswordReset: async (req, res) => {
        try {
            const { email } = req.body;
            const { user, resetToken } = await authService.forgotPassword(email);

            const resetUrl = `${BASE_URL}/trackcalorilog/reset-password?token=${resetToken}`;

            await sendEmail(
                user.email,
                'Réinitialisation de votre mot de passe',
                `
                    <p>Vous avez demandé une réinitialisation de mot de passe.</p>
                    <p>Cliquez sur ce lien pour choisir un nouveau mot de passe (valable 1h) :</p>
                    <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
                `
            );

            res.status(200).json({ message: "Email de réinitialisation envoyé !" });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    handlePasswordReset: async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            await authService.resetPassword(token, newPassword);
            res.status(200).json({ message: "Mot de passe modifié avec succès !" });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = authController;