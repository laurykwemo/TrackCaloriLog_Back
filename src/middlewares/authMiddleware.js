const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');

// 🔹 Vérifie si l'utilisateur est connecté (token valide)
const isAuthenticated = async (req, res, next) => {
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
};

// 🔹 Vérifie si l'utilisateur est admin
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accès refusé. Admin uniquement." });
    }
    next();
};

module.exports = { isAuthenticated, isAdmin };
