const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
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
const DB_URI = 'mongodb://localhost:27017/trackcalorilog_db';

//Middleware pour les données de formulaire
//app.use(express.json());

const isAdmin = (req, res, next) => {
    // On peut passer le token dans les cookies ou le header pour la page HTML
    // Mais le plus simple pour une page HTML est de vérifier le token envoyé
    const token = req.query.token || req.headers['authorization'];

    if (!token) return res.redirect('/trackcalorilog/login');

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        if (decoded.role === 'admin') {
            next(); // C'est un admin, on continue !
        } else {
            res.status(403).send("Accès refusé : vous n'êtes pas administrateur.");
        }
    } catch (err) {
        res.redirect('/trackcalorilog/login');
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
app.use('/api', usersexRoutes);
app.use('/api', deleteduserRoutes);
app.use('/admin', adminRoutes);
app.use('/trackcalorilog', authRoutes);
//app.use(express.static('public'));

//Route de base
app.get('/', (req, res) => {
    //res.send('API Express opérationnelle.');
    res.sendFile(__dirname + '/modules/user/user.html');
    //res.sendFile(__dirname + '/modules/user/indexuser.html');
});

app.get('/admin', (req, res) => {
    //res.send('API Express opérationnelle.');
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

module.exports = app;