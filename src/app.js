require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// Imports des routes
const userRoutes = require('./modules/user/user.routes');
const usersexRoutes = require('./modules/usersex/usersex.routes');
const deleteduserRoutes = require('./modules/deleteduser/deleteduser.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const authRoutes = require('./modules/auth/auth.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const nutritionRoutes = require('./modules/nutrition/nutrition.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- MIDDLEWARE DE VÉRIFICATION POUR LES PAGES HTML ---
const verifyTokenPage = (req, res, next) => {
    // 1. Récupération multi-sources
    let token = req.query.token || req.headers['authorization'];

    console.log("--- DEBUG AUTH ---");
    console.log("URL appelée :", req.originalUrl);
    console.log("Token détecté :", token ? "OUI (début: " + token.substring(0, 10) + ")" : "NON");

    if (!token) {
        console.log("ACCÈS REFUSÉ : Redirection login");
        return res.redirect('/trackcalorilog/login');
    }

    // 2. Nettoyage
    if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }

    try {
        // On utilise la clé du .env ou la clé de secours (doit être la même que pour le login)
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("ÉCHEC JWT :", err.message);
        res.redirect('/trackcalorilog/login?error=expired');
    }
};

// --- CONFIGURATION GENERALE ---
app.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// MongoDB
const DB_URI = process.env.NODE_ENV === 'test' 
    ? (process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/trackcalorilog_test')
    : (process.env.MONGO_URI || 'mongodb://localhost:27017/trackcalorilog_db');

if (process.env.NODE_ENV !== 'test') {
    /*mongoose.connect(DB_URI)
        .then(() => console.log(`Connecté à MongoDB : ${DB_URI}`))
        .catch(err => console.error('Erreur MongoDB:', err));*/
}

app.set('io', io);
io.on('connection', (socket) => {
    console.log('Un administrateur est connecté au flux de sécurité 🛡️');
});

// --- ROUTES API ---
app.use('/api', usersexRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deletedusers', deleteduserRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/trackcalorilog', authRoutes);

// --- ROUTES PAGES (SERVEUR DE FICHIERS) ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'modules/user/user.html'));
});

// ROUTE ADMIN CORRIGÉE
app.get('/admin', verifyTokenPage, (req, res) => {
    // Une fois le token vérifié, on check le rôle
    if (req.user.role !== 'admin') {
        console.warn(`[SECURITY] Tentative d'accès admin par ${req.user.email || req.user.id}`);
        return res.status(403).send("Accès refusé : Droits administrateur requis.");
    }
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

app.get('/nutrition', verifyTokenPage, (req, res) => {
    res.sendFile(path.join(__dirname, 'modules/nutrition/meal.html'));
});

app.get('/nutrition/catalogue', verifyTokenPage, (req, res) => {
    res.sendFile(path.join(__dirname, 'modules/nutrition/food.html'));
});

app.get('/nutrition/journal', verifyTokenPage, (req, res) => {
    res.sendFile(path.join(__dirname, 'modules/nutrition/journal.html'));
});

// --- FIN ---
app.use((req, res) => {
    res.status(404).json({ message: "Route non trouvée" });
});

/*server.listen(PORT, () => {
    console.log(`Serveur actif sur le port ${PORT}`);
});

module.exports = app;*/
module.exports = { app, server, io };