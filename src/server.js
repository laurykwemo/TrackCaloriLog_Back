require('dotenv').config();
const PORT = process.env.PORT || 3000;
const DB_URI = 'mongodb://localhost:27017/trackcalorilog_db';
const mongoose = require('mongoose');
const app = require('./app'); // On importe l'application déjà configurée depuis app.js

mongoose.connect(DB_URI)
    .then(() => {
        console.log('Connexion à MongoDB réussie');
        app.listen(PORT, () => {
            console.log(`Serveur démarré sur http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Erreur de connexion à la base de données :', err);
        process.exit(1);
    });