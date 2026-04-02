require('dotenv').config();
const mongoose = require('mongoose');
const cron = require('node-cron');
const User = require('./modules/user/user.model');
const { app, server } = require('./app'); // On récupère l'app et le serveur http

const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGO_URI; // Utilise bien le lien Atlas du .env

mongoose.connect(DB_URI)
    .then(() => {
        console.log('✅ Connexion à MongoDB Atlas réussie !');
        // On lance le serveur HTTP (qui contient Socket.io) et NON app.listen
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Erreur de connexion Atlas :', err);
        process.exit(1);
    });

    // Débannissement automatique toutes les 10 minutes
cron.schedule('*/10 * * * *', async () => {
    try {
        const now = new Date();
        const result = await User.updateMany(
            { 
                isBanned: true, 
                banExpires: { $lte: now } 
            }, 
            { 
                $set: { isBanned: false, banExpires: null, banReason: null, isActive: true } 
            }
        );
        if(result.modifiedCount > 0) {
            console.log(`[CRON] ${result.modifiedCount} utilisateur(s) débanni(s) automatiquement.`);
        }
    } catch (error) {
        console.error("[CRON] Erreur lors du débannissement auto:", error);
    }
});