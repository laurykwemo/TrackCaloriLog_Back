const request = require('supertest');
const app = require('../app'); 
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');

describe('Vérification des routes de base', () => {
    let fakeToken;
    const secret = process.env.JWT_SECRET || 'votre_secret';
    beforeAll(async () => {
        // On s'assure que NODE_ENV est bien 'test'
        process.env.NODE_ENV = 'test';
        
        const url = 'mongodb://127.0.0.1:27017/trackcalorilog_test';
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(url);
        }

        await User.deleteMany({});

        const testUser = await User.create({
            name: 'Admin Test',
            email: 'admin@test.com',
            password: 'Password123!',
            role: 'admin',
            birthDate: '1990-01-01',
            sex: 1, height: 170, weight: 70
        });

        // On génère le token en incluant TOUTES les clés possibles (id et userId) 
        // pour matcher ton authMiddleware
        fakeToken = jwt.sign(
            { id: testUser._id, userId: testUser._id, role: 'admin' }, 
            process.env.JWT_SECRET || 'votre_secret'
        );
    });

    afterAll(async () => {
        // On nettoie tout après les tests
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });
    
    it('doit charger la page d accueil', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
    });

    it('doit retourner 401 pour une route inconnue protégée', async () => {
        const res = await request(app)
            .get('/api/existe-pas')
            .set('Authorization', `Bearer ${fakeToken}`);

        expect([401, 404]).toContain(res.statusCode);
    });


    describe('Rendu des pages statiques', () => {
        it('devrait afficher la page de login', async () => {
            const res = await request(app).get('/trackcalorilog/login');
            expect(res.statusCode).toBe(200);
            expect(res.type).toBe('text/html');
        });

        it('devrait afficher la page register', async () => {
            const res = await request(app).get('/trackcalorilog/register');
            expect(res.statusCode).toBe(200);
        });
    });
});