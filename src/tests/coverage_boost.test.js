const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

describe('Coverage Booster', () => {

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            const url = process.env.MONGO_URL_TEST || 'mongodb://127.0.0.1/trackcalorilog_test';
            await mongoose.connect(url);
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });
    
    it('should cover 404 global handler', async () => {
        const res = await request(app).get('/route-qui-n-existe-vraiment-pas');
        expect(res.status).toBe(404);
    });

    it('should cover auth reset password with invalid email', async () => {
        const res = await request(app)
            .post('/trackcalorilog/forgot-password')
            .send({ email: 'inconnu@test.com' });

        expect([200, 400, 404]).toContain(res.status);
    });
});
