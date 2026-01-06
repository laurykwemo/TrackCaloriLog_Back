require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Import manquant
const app = require('../app');
const UserSex = require('../modules/usersex/usersex.model');
const User = require('../modules/user/user.model'); // Import manquant
const UserSexService = require('../modules/usersex/usersex.service');

describe('UserSex Module Tests', () => {
    let adminToken;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            const url = process.env.MONGO_URL_TEST || 'mongodb://127.0.0.1/trackcalorilog_test';
            await mongoose.connect(url);
        }

        // Nettoyage initial des utilisateurs pour éviter les doublons d'email
        await User.deleteMany({});

        const admin = await User.create({
            name: 'Admin Sexes',
            email: 'adminsex@test.com',
            password: 'Password123!',
            role: 'admin',
            birthDate: '1990-01-01',
            sex: 1, 
            height: 170, 
            weight: 70
        });

        // Générer le token réel pour les tests
        adminToken = jwt.sign(
            { id: admin._id, role: 'admin' }, 
            process.env.JWT_SECRET || 'votre_secret'
        );
    });

    beforeEach(async () => {
        await UserSex.deleteMany({});
    });

    afterAll(async () => {
        await User.deleteMany({}); // Nettoyage final
        await mongoose.connection.close();
    });

    describe('POST /api/addsexes', () => {
        it('devrait créer un sexe avec ID auto-incrémenté = 1', async () => {
            const res = await request(app)
                .post('/api/addsexes')
                .set('Authorization', `Bearer ${adminToken}`) // Ajout du token
                .send({
                    label: 'Homme',
                    bmrCoef: 5,
                    description: 'desc'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.sex._id).toBe(1);
        });

        it('devrait incrémenter l ID à 2', async () => {
            // Premier ajout
            await request(app)
                .post('/api/addsexes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    label: 'Homme',
                    bmrCoef: 5,
                    description: 'desc'
                });

            // Deuxième ajout
            const res = await request(app)
                .post('/api/addsexes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    label: 'Femme',
                    bmrCoef: -161,
                    description: 'desc'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.sex._id).toBe(2);
        });

        it('devrait échouer si bmrCoef est manquant', async () => {
            const res = await request(app)
                .post('/api/addsexes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ label: 'Homme', description: 'desc' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/AllSexes', () => {
        it('devrait récupérer tous les sexes', async () => {
            await request(app)
                .post('/api/addsexes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ label: 'Homme', bmrCoef: 5, description: 'desc' });

            await request(app)
                .post('/api/addsexes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ label: 'Femme', bmrCoef: -161, description: 'desc' });

            const res = await request(app)
                .get('/api/AllSexes')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
        });
    });

    describe('Service error handling', () => {
        it('should throw DB_ERROR if find fails', async () => {
            jest.spyOn(UserSex, 'find').mockRejectedValue(new Error('DB_ERROR'));

            await expect(UserSexService.getAllSexes()).rejects.toThrow('DB_ERROR');

            UserSex.find.mockRestore();
        });
    });
});