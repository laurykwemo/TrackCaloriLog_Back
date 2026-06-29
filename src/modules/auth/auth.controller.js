const authService = require('./auth.service');
const nodemailer = require('nodemailer');
const User = require('../user/user.model');

// 1. On définit la config du transporteur une seule fois en haut
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// 2. Logique d'envoi réutilisable
const sendEmailLogic = async (email) => {
    const user = await authService.resendVerificationEmail(email);
    const verificationUrl = `${BASE_URL}/trackcalorilog/verify-email?token=${user.emailVerificationToken}`;
    
    const mailOptions = {
        from: '"TrackCaloriLog" <9e8a2e001@smtp-brevo.com>',
        to: user.email,
        subject: 'Vérification de votre compte - Nouveau lien',
        html: `
            <h1>Validation de votre email</h1>
            <p>Vous avez demandé un nouveau lien de vérification.</p>
            <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px;">
                Vérifier mon compte
            </a>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://trackcalorilog-back.onrender.com' 
    : 'http://localhost:3000';

const authController = {
    
    register: async (req, res) => {
        try {
            const user = await authService.register(req.body);
            const verificationUrl = `${BASE_URL}/trackcalorilog/verify-email?token=${user.emailVerificationToken}`;

            await transporter.sendMail({
                from: '"TrackCaloriLog" <9e8a2e001@smtp-brevo.com>',
                to: user.email,
                subject: 'Bienvenue ! Vérification de votre adresse email',
                html: `<h1>Bienvenue ${user.name} !</h1><p>Cliquez ici pour vérifier votre email:</p><a href="${verificationUrl}">Activer mon compte</a>`
            });

            res.status(201).json({
                message: "Inscription réussie. Un email de vérification a été envoyé.",
                user: { id: user._id, name: user.name, email: user.email }
            });
        } catch (error) {
            res.status(400).json({ message: error.message || "Erreur lors de l'inscription" });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            const user = result.user;

            // Le nettoyage du ban expiré est désormais géré dans authService.login
            // On sauvegarde uniquement pour persister lastLogin et la remise à zéro des tentatives
            await user.save();

            // On renvoie une version propre du user (sans le password)
            return res.status(200).json({
                token: result.token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role }
            });

        } catch (error) {
            // Gestion du mail de vérification (inchangée mais propre)
            if (error.message.includes("vérifier votre boîte mail")) {
                try {
                    await sendEmailLogic(req.body.email); 
                    return res.status(401).json({ message: "Compte non vérifié. Un nouveau lien a été envoyé." });
                } catch (err) {
                    return res.status(500).json({ message: "Erreur lors du renvoi du mail." });
                }
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
                // Si le user n'est pas trouvé, c'est souvent que le token a expiré
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
            // 2. Vérifie ce que contient req.user (rempli par ton middleware isAuthenticated)
            // Dans ton token, la clé semble être "userId" d'après ton log console
            const idToFind = req.user.userId || req.user.id;

            if (!idToFind) {
                return res.status(401).json({ message: "ID utilisateur absent du token" });
            }

            const user = await User.findById(idToFind).select('-password');
            
            if (!user) {
                return res.status(404).json({ message: "Utilisateur non trouvé en base" });
            }

            // On renvoie l'objet user DIRECTEMENT (sans l'envelopper)
            res.status(200).json(user); 

        } catch (error) {
            console.error("Erreur détaillée :", error); // Cela s'affichera dans ton terminal VS Code
            res.status(500).json({ message: "Erreur serveur lors de la récupération du profil" });
        }
    },
        // Demander la réinitialisation
    requestPasswordReset: async (req, res) => {
        try {
            const { email } = req.body;
            const { user, resetToken } = await authService.forgotPassword(email);

            const resetUrl = `${BASE_URL}/trackcalorilog/reset-password?token=${resetToken}`;

            await transporter.sendMail({
                from: '"TrackCaloriLog" <9e8a2e001@smtp-brevo.com>',
                to: user.email,
                subject: 'Réinitialisation de votre mot de passe',
                html: `
                    <p>Vous avez demandé une réinitialisation de mot de passe.</p>
                    <p>Cliquez sur ce lien pour choisir un nouveau mot de passe (valable 1h) :</p>
                    <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
                `
            });

            res.status(200).json({ message: "Email de réinitialisation envoyé !" });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Valider le nouveau mot de passe
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
