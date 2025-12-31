const request = require('supertest');
const app = require('../app'); // Vérifie bien le chemin vers app.js
const mongoose = require('mongoose');
const User = require('../modules/user/user.model');
const jwt = require('jsonwebtoken');

describe('Tests du module User', () => {
    let adminToken;
    let userId;

    beforeAll(async () => {
        // Connexion à la base de test si nécessaire
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/trackcalorilog_test');
        }
        await User.deleteMany({});

        // 1. Création d'un admin pour tester les routes protégées
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'hashedPassword123',
            role: 'admin',
            birthDate: '1990-01-01',
            sex: 1, height: 180, weight: 80
        });

        // Génération d'un token (doit contenir userId comme attendu par ton middleware)
        adminToken = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET || 'secret');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('doit créer un nouvel utilisateur avec succès', async () => {
        const res = await request(app)
            .post('/api/addusers') // Correction de l'URL (/users -> /addusers)
            .send({
                name: 'New User',
                email: 'newuser@example.com',
                password: 'Password123!',
                birthDate: '1995-05-15',
                sex: 1, height: 170, weight: 65
            });
        
        expect(res.statusCode).toBe(201);
        userId = res.body.user._id;
    });

    it('Devrait bloquer AllUsers si aucun token n\'est fourni', async () => {
        const res = await request(app).get('/api/AllUsers');
        expect(res.statusCode).toBe(401); // Maintenant ça passera car on a ajouté le middleware
    });

    it('Devrait retourner 404 si l\'utilisateur à supprimer n\'existe pas', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .delete(`/api/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(404);
    });

    it('Devrait bloquer une action admin si l\'utilisateur est un simple user', async () => {
        // Création d'un simple utilisateur
        const simpleUser = await User.create({
            name: 'Simple',
            email: `user${Date.now()}@test.com`,
            password: 'Password123!',
            role: 'user',
            birthDate: '1990-01-01',
            sex: 1, height: 170, weight: 70
        });
        
        const userToken = jwt.sign({ userId: simpleUser._id }, process.env.JWT_SECRET || 'secret');

        // Tentative d'accès à une route /admin/
        const res = await request(app)
            .patch(`/admin/toggleActive/${simpleUser._id}`)
            .set('Authorization', `Bearer ${userToken}`);
        
        expect(res.statusCode).toBe(403); // Accès refusé
    });
    it('Devrait renvoyer 401 si le token est malformé', async () => {
        const res = await request(app)
            .get('/api/AllUsers')
            .set('Authorization', 'Bearer token-invalide-nimportequoi');
        
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Token invalide");
    });
    it('Devrait échouer si l\'utilisateur a moins de 13 ans (Couverture service)', async () => {
        const res = await request(app)
            .post('/api/addusers')
            .send({
                name: 'Petit', email: 'enfant@test.com', password: 'password123',
                birthDate: '2020-01-01', // Trop jeune
                sex: 1, height: 100, weight: 20
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/13 ans/); // Vérifie le message d'erreur
    });

    it('Devrait échouer si l\'email est invalide', async () => {
        const res = await request(app)
            .post('/api/addusers')
            .send({
                name: 'Test', email: 'pas-un-email', password: 'password123',
                birthDate: '1990-01-01', sex: 1, height: 170, weight: 70
            });
        expect(res.statusCode).toBe(400);
    });
});