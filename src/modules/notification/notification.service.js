const Notification = require('./notification.model');

const notificationService = {
    createAlert: async (app, data) => {
        try {
            // Fenêtre de 30 secondes : on ne veut pas harceler l'admin
            const cooldownTime = new Date(Date.now() - 30000); 

            // On cherche si CET UTILISATEUR a déjà une alerte de sécurité récente
            // On ne filtre plus par "message" ou "url", juste par email
            const alreadyAlerted = await Notification.findOne({
                userEmail: data.userEmail,
                createdAt: { $gte: cooldownTime }
            });

            if (alreadyAlerted) {
                console.log(`[SECURITY] Alerte ignorée pour ${data.userEmail} (déjà signalée récemment)`);
                return null;
            }

            const newNotif = await Notification.create({
                message: data.message || `Tentative d'accès non autorisée détectée`, // Message générique
                userEmail: data.userEmail,
                severity: 'high',
                ipAddress: data.ipAddress
            });

            console.log("Tentative d'envoi Socket à l'admin pour :", newNotif.userEmail);
            const io = app.get('io');
            if (io) {
                io.emit('new_security_alert', newNotif);
                console.log("Signal émis avec succès !");
            } else {
                console.error("ERREUR : io est undefined dans le service !");
            }

            return newNotif;
        } catch (error) {
            console.error("Erreur Service Notification:", error);
        }
    },

    getAll: async () => {
        return await Notification.find().sort({ createdAt: -1 }).limit(20);
    },

    markAsRead: async (id) => {
        return await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    }
};

module.exports = notificationService;