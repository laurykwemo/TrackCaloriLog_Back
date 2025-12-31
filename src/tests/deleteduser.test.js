const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose'); // Import manquant
const User = require('../modules/user/user.model');
const jwt = require('jsonwebtoken'); // Import manquant

describe('DeletedUser Module Tests', () => {
    let adminToken;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect('mongodb://localhost:27017/trackcalorilog_test');
        }
        // On crée un admin pour avoir un token valide
        const admin = await User.create({
            name: 'Admin Del', email: 'admin_del@test.com', password: 'password123',
            role: 'admin', birthDate: '1980-01-01', sex: 1, height: 180, weight: 80
        });
        adminToken = jwt.sign({ userId: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'secret');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('Devrait supprimer un utilisateur (Soft Delete)', async () => {
        const user = await User.create({
            name: 'To Delete', email: `del_${Date.now()}@test.com`, password: 'password123',
            birthDate: '1990-01-01', sex: 1, height: 170, weight: 70
        });

        const res = await request(app)
            .delete(`/api/${user._id}`) 
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
    }, 15000);
});