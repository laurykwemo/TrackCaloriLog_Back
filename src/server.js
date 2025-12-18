const express = require('express');
const mongoose = require('mongoose');

const userRoutes = require('user.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = 'mongodb://localhost:27017/trackcalorilog_db';

//Middleware pour les données de formulaire
app.use(express.json());

//Middleware de logging simple pour voir les requetes arrivées
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next(); //Passe au middleware/route suivant
});

// --- 3. Définition des Routes ---
app.use('/api', userRoutes);

//Route de base
app.get('/', (req, res) => {
    res.send('API Express opérationnelle.');
});

mongoose.connect(DB_URI)
    .then(() => {
        console.log('Connexion à la base de données Mongo réussie');
        app.listen(PORT, () => {
            console.log(`Serveur démarré sur http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Erreur de connexion à la base de données :', err);
        process.exit(1); //Arrete l'application en cas d'erreur critique de DB
    });