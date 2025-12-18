/*const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/trackcalorilog_db')
    .then(()=>{
        console.log('Connexion réussie à MongoDB');
    })
    .catch((err)=>{
        console.error('erreur de connexion :', err);
    });*/
    
/*const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/trackcalorilog_db')
  .then(() => {
    console.log('Connexion réussie à MongoDB');

    // Schéma (Table)
    const userSchema = new mongoose.Schema({
      nom: String,
      age: Number,
      email: String
    });

    const User = mongoose.model('Test', userSchema);

    // Ajout d’un document (ligne)
    const nouvelUtilisateur = new User({
      nom: 'Alice',
      age: 25,
      email: 'alice@example.com'
    });

    return nouvelUtilisateur.save();
  })
  .then(() => {
    console.log('Donnée enregistrée ! Base et collection créées.');
  })
  .catch(err => {
    console.error('Erreur :', err);
  });*/

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
//const indexuser = require('../public/indexuser');

const userRoutes = require('./modules/user/user.routes');
const usersexRoutes = require('./modules/usersex/usersex.routes');
const deleteduserRoutes = require('./modules/deleteduser/deleteduser.routes');
const adminRoutes = require('./modules/admin/admin.routes')
const userModel = require('./modules/user/user.model');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = 'mongodb://localhost:27017/trackcalorilog_db';

//Middleware pour les données de formulaire
//app.use(express.json());


app.use(bodyParser.json());
//app.use(express.static(path.join(__dirname, 'view')));

//Middleware de logging simple pour voir les requetes arrivées
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next(); //Passe au middleware/route suivant
});

app.use(express.static(path.join(__dirname, 'modules')));

// --- 3. Définition des Routes ---
app.use('/api', userRoutes);
app.use('/api', usersexRoutes);
app.use('/api', usersexRoutes);
app.use('/api', deleteduserRoutes);
app.use('/admin', adminRoutes);
//app.use(express.static('public'));

//Route de base
app.get('/', (req, res) => {
    //res.send('API Express opérationnelle.');
    res.sendFile(__dirname + '/modules/user/indexuser.html');
});

app.get('/admin', (req, res) => {
    //res.send('API Express opérationnelle.');
    res.sendFile(__dirname + '/modules/admin/admin.html');
});
console.log(__dirname)
mongoose.connect(DB_URI)
    .then(() => {
        console.log('Connexion à la base de données Mongo réussie');
        app.listen(PORT, () => {
            console.log(`Serveur démarré sur http://localhost:${PORT}`);
        });

        /*const User = mongoose.model('User', userModel.userSchema);

        // Ajout d’un document (ligne)
        const nouvelUtilisateur = new User({
            nom: 'Laury',
            age: 23,
            email: 'alannbaywala@gmail.com',
            password: 'Alann12@',
            birthDate: '2002-02-28',
            sex: 'Masculin',
            height: 166,
            weight: 87.9,
        });

        return nouvelUtilisateur.save();*/
    })
    .catch((err) => {
        console.error('Erreur de connexion à la base de données :', err);
        process.exit(1); //Arrete l'application en cas d'erreur critique de DB
    });
