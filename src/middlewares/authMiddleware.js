const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');
const notificationService = require('../modules/notification/notification.service');

// Cache global pour éviter les doublons de traitement
const activeAlerts = {}; 

const authMiddleware = {
    isAuthenticated: async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: "Token manquant" });
            }
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret');
            const user = await User.findById(decoded.userId || decoded.id).select('-password');
            if (!user) return res.status(401).json({ message: "Utilisateur introuvable" });
            
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ message: "Session invalide" });
        }
    },

    isAdmin: async (req, res, next) => {
        if (req.method === 'OPTIONS') return next(); // Ignore le preflight CORS
        if (!req.user) return res.status(401).json({ message: "Non authentifié" });
        if (req.user.role === 'admin') return next();

        const alertKey = `${req.user.email}-${req.originalUrl}`;
        const now = Date.now();

        // Si une alerte identique a eu lieu il y a moins de 3 secondes, on ignore totalement
        if (activeAlerts[alertKey] && (now - activeAlerts[alertKey] < 3000)) {
            return res.status(403).json({ message: "Accès refusé" });
        }

        // On enregistre le timestamp IMMÉDIATEMENT (avant le try/catch)
        activeAlerts[alertKey] = now;

        console.warn(`[SECURITY] Tentative bloquée pour: ${req.user.email}`);

        try {
            const alertData = {
                message: `Tentative d'accès interdite à ${req.originalUrl}`,
                userEmail: req.user.email,
                ipAddress: req.ip,
                severity: 'high'
            };
            
            // On ne met pas "await" ici pour ne pas bloquer la réponse client 
            // tout en laissant le service gérer l'anti-spam interne.
            notificationService.createAlert(req.app, alertData).catch(err => console.error(err));
            
        } catch (e) {
            console.error("Erreur middleware alerte:", e);
        }

        return res.status(403).json({ message: "Accès refusé : Droits administrateur requis." });
    }
};

module.exports = authMiddleware;