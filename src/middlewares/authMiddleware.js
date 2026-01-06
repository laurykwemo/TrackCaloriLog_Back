/*const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');


const authMiddleware = {
    // 🔹 Vérifie si l'utilisateur est connecté (token valide)
    isAuthenticated: async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            if (!token) {
                return res.status(401).json({ message: "Non authentifié - Token manquant" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId).select("-password");
            next();
        } catch (error) {
            return res.status(401).json({ message: "Token invalide" });
        }
    },
    // 🔹 Vérifie si l'utilisateur est admin
    isAdmin: (req, res, next) => {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès refusé. Admin uniquement." });
        }
        next();
    }
};

module.exports = authMiddleware;*/

const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');

const authMiddleware = {
    // Dans middlewares/authMiddleware.js
    isAuthenticated: async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: "Token manquant ou mal formé" });
            }

            const token = authHeader.split(" ")[1];
            // Utilisez impérativement le même secret que lors de la connexion
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret');

            // Utilisation de la clé 'userId' vue dans vos logs
            const idToFind = decoded.userId || decoded.id;

            const user = await User.findById(idToFind).select('-password');
            if (!user) {
                console.error("Utilisateur non trouvé en DB avec l'ID:", idToFind);
                return res.status(401).json({ message: "Utilisateur introuvable" });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error("Erreur AuthMiddleware:", error.message);
            return res.status(401).json({ message: "Session expirée ou invalide" });
        }
    },

    isAdmin: (req, res, next) => {
        let token = req.query.token || req.headers['authorization'];

        if (!token) {
            console.log("Accès refusé : Aucun token trouvé dans la requête");
            return res.redirect('/trackcalorilog/login');
        }

        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }

        try {
            // Utilise la même clé que dans tes tests pour la cohérence
            const secret = process.env.JWT_SECRET || 'votre_secret';
            const decoded = jwt.verify(token, secret);
            
            if (decoded.role === 'admin') {
                req.user = decoded;
                next();
            } else {
                res.status(403).send("Accès refusé : vous n'êtes pas admin.");
            }
        } catch (err) {
            console.error("Erreur JWT Dashboard:", err.message);
            // On redirige vers login si le token est expiré ou invalide
            res.redirect('/trackcalorilog/login?error=expired');
        }
    }
};

module.exports = authMiddleware;


