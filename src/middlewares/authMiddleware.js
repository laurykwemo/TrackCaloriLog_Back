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
    isAuthenticated: async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ message: "Token manquant" });
            }

            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return res.status(401).json({ message: "Utilisateur introuvable" });
            }

            // On injecte l'utilisateur complet dans la requête
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ message: "Token invalide" });
        }
    },

    isAdmin: (req, res, next) => {
        console.log("DEBUG ADMIN CHECK:", { 
            hasUser: !!req.user, 
            role: req.user?.role,
            id: req.user?._id 
        });
        // Suppression du "force pass" qui cassait tes tests de sécurité
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès refusé. Admin uniquement." });
        }
        next();
    }
};

module.exports = authMiddleware;


