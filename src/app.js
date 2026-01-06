require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
//const indexuser = require('../public/indexuser');

const userRoutes = require('./modules/user/user.routes');
const usersexRoutes = require('./modules/usersex/usersex.routes');
const deleteduserRoutes = require('./modules/deleteduser/deleteduser.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const authRoutes = require('./modules/auth/auth.routes');
const userModel = require('./modules/user/user.model');

const app = express();
const PORT = process.env.PORT || 3000;
// Détermination de l'URI de la base de données
const DB_URI = process.env.NODE_ENV === 'test' 
    ? (process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/trackcalorilog_test')
    : (process.env.MONGO_URI || 'mongodb://localhost:27017/trackcalorilog_db');

// Connexion à la base de données (Seulement si on n'est PAS en test, car Jest s'en occupe)
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(DB_URI)
        .then(() => console.log(`Connecté à MongoDB : ${DB_URI}`))
        .catch(err => console.error('Erreur de connexion MongoDB:', err));
}

//Middleware pour les données de formulaire
//app.use(express.json());

// Dans app.js
const isAdmin = (req, res, next) => {
    let token = req.query.token || req.headers['authorization'];

    if (!token) return res.redirect('/trackcalorilog/login');

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    try {
        const secret = process.env.JWT_SECRET || 'votre_secret';
        const decoded = jwt.verify(token, secret);
        
        // Vérifiez que le rôle est bien 'admin' dans le payload
        if (decoded.role === 'admin') {
            next();
        } else {
            res.status(403).send("Accès réservé aux administrateurs.");
        }
    } catch (err) {
        console.error("Erreur isAdmin Page:", err.message);
        res.redirect('/trackcalorilog/login?error=session_expired');
    }
};


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname, 'view')));

//Middleware de logging simple pour voir les requetes arrivées
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next(); //Passe au middleware/route suivant
});

app.use('/modules', express.static(path.join(__dirname, 'modules')));

// --- 3. Définition des Routes ---
app.use('/api', userRoutes);
app.use('/api', usersexRoutes);
app.use('/api/deletedsusers', deleteduserRoutes);
app.use('/api/admin', adminRoutes);
app.use('/trackcalorilog', authRoutes);
//app.use(express.static('public'));

//Route de base
app.get('/', (req, res) => {
    //res.send('API Express opérationnelle.');
    res.sendFile(__dirname + '/modules/user/user.html');
    //res.sendFile(__dirname + '/modules/user/indexuser.html');
});

app.get('/admin', (req, res, next) => {
    // Middleware inline pour la redirection navigateur
    const token = req.query.token || req.headers['authorization'];
    if (!token) return res.redirect('/trackcalorilog/login');
    next();
}, (req, res) => {
    res.sendFile(path.join(__dirname, 'modules/admin/admin.html'));
});

app.get('/trackcalorilog/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'modules/auth/login.html'));
});

app.get('/trackcalorilog/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'modules/auth/register.html'));
});

app.get('/trackcalorilog/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'modules/auth/email.html'));
});

app.get('/trackcalorilog/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'modules/auth/password.html'));
});



app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.status(404).end());

console.log(__dirname)

// Middleware pour capturer les routes inexistantes
app.use((req, res) => {
    res.status(404).json({ message: "Route non trouvée" });
});

module.exports = app;