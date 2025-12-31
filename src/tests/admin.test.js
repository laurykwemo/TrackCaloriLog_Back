process.env.JWT_SECRET = 'ma_cle_secrete_test_123';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../modules/user/user.model');
const jwt = require('jsonwebtoken');

describe('Admin Module Tests', () => {
    let adminToken;
    let testUser;

    beforeAll(async () => {

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect('mongodb://localhost:27017/trackcalorilog_test');
        }
        await User.deleteMany({});

        const admin = await User.create({
            name: 'Boss', email: 'admin@test.com', password: 'password123',
            role: 'admin', birthDate: '1980-01-01', sex: 1, height: 180, weight: 80,
            isActive: true
        });

        // AJOUT DU ROLE DANS LE TOKEN ICI
        adminToken = jwt.sign(
            { userId: admin._id, role: 'admin' }, 
            process.env.JWT_SECRET
        );

        testUser = await User.create({
            name: 'User', email: 'user@test.com', password: 'password123',
            role: 'user', birthDate: '1990-01-01', sex: 1, height: 170, weight: 70,
            isActive: true
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('GET /api/AllUsers - Devrait lister les users', async () => {
        const res = await request(app)
            .get('/api/AllUsers')
            .set('Authorization', `Bearer ${adminToken}`);
        if (res.statusCode === 403) {
            console.log("DEBUG AUTH - User dans req:", res.body);
        }
        expect(res.statusCode).toBe(200);
    });

    it('PATCH /admin/toggleActive/:id - Devrait inverser le statut', async () => {
        const res = await request(app)
            .patch(`/admin/toggleActive/${testUser._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
    });

    it('PUT /admin/updateRole/:id - Devrait rejeter un rôle invalide', async () => {
        const res = await request(app)
            .put(`/admin/updateRole/${testUser._id}`) 
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'Dieu' });
        expect(res.statusCode).toBe(400); 
    });
});