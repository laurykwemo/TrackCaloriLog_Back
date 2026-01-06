process.env.JWT_SECRET = 'ma_cle_secrete_test_123';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../modules/user/user.model');
const jwt = require('jsonwebtoken');
const AdminService = require('../modules/admin/admin.service');

describe('Admin Module Tests', () => {
    let adminToken;
    let userToken; // <--- DÉCLARÉ ICI
    let testUser;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            const testUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/trackcalorilog_test';
            await mongoose.connect(testUri);
        }
        await User.deleteMany({});

        // 1. Création Admin
        const admin = await User.create({
            name: 'Boss', email: 'admin@test.com', password: 'password123',
            role: 'admin', birthDate: '1980-01-01', sex: 1, height: 180, weight: 80,
            isActive: true
        });

        adminToken = jwt.sign(
            { userId: admin._id, role: 'admin' }, 
            process.env.JWT_SECRET
        );

        // 2. Création User simple
        testUser = await User.create({
            name: 'User', email: 'user@test.com', password: 'password123',
            role: 'user', birthDate: '1990-01-01', sex: 1, height: 170, weight: 70,
            isActive: true
        });

        userToken = jwt.sign(
            { userId: testUser._id, role: 'user' }, 
            process.env.JWT_SECRET
        );
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('GET /api/AllUsers - Devrait lister les users', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
    });

    it('PATCH /admin/toggleActive/:id - Devrait inverser le statut', async () => {
        const res = await request(app)
            .patch(`/api/admin/toggleActive/${testUser._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
    });

    it('PUT /api/admin/updateRole/:id - Devrait mettre à jour le rôle', async () => {
        const res = await request(app)
            .put(`/api/admin/users/${testUser._id}/role`) // Utilise l'ID du beforeAll
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'admin' });

        expect(res.statusCode).toBe(200);
        
        // Ajoute un log temporaire si ça échoue encore pour voir ce que contient res.body
        // console.log(res.body); 

        // Vérifie si ton controller renvoie { user: {...} } ou juste { ... }
        const roleResult = res.body.user ? res.body.user.role : res.body.role;
        expect(roleResult).toBe('admin');
    });

    it('should handle errors in getAllUsers service', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            select: jest.fn().mockRejectedValue(new Error('Force Fail'))
        };
        const spy = jest.spyOn(User, 'find').mockReturnValue(mockQuery);
        await expect(AdminService.getAllUsers()).rejects.toThrow('Force Fail');
        spy.mockRestore();
    });

    it('GET /admin/stats - Devrait retourner les statistiques', async () => {
        const stats = await AdminService.getStats();
        expect(stats).toHaveProperty('totalUsers');
        expect(stats.totalUsers).toBeGreaterThan(0);
    });

    // TEST POUR LE COVERAGE DE APP.JS (Lignes 27-39)
    it('devrait autoriser l\'accès via token en paramètre URL', async () => {
        // On teste une route qui passe par le middleware isAdmin de app.js
        const res = await request(app)
            .get(`/admin?token=${adminToken}`); 
        
        // Note: Si ça renvoie 401, vérifie que le middleware isAdmin dans app.js 
        // utilise bien process.env.JWT_SECRET pour vérifier.
        expect([200, 302]).toContain(res.statusCode); 
    });

    it('devrait refuser l\'accès admin à un utilisateur simple', async () => {
        const res = await request(app)
            .get('/admin')
            .set('Authorization', `Bearer ${userToken}`);
        
        expect(res.statusCode).toBe(403);
    });

    it('devrait renvoyer 404 si l\'utilisateur à modifier n\'existe pas', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .patch(`/api/admin/toggleActive/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toBe(404);
    });

    // À ajouter dans le bloc describe('Admin Module Tests', ...)

    it('POST /api/admin/users/ban/:id - Devrait bannir un utilisateur', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const res = await request(app)
            .post(`/api/admin/users/ban/${testUser._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ banUntil: tomorrow });

        expect(res.statusCode).toBe(200);
        expect(res.body.user.isBanned).toBe(true);
    });

    it('POST /api/admin/users/unban/:id - Devrait débannir un utilisateur', async () => {
        const res = await request(app)
            .post(`/api/admin/users/unban/${testUser._id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.isBanned).toBe(false);
    });

    describe('Admin Module - Error Handling Coverage', () => {

        it('should handle error in toggleActive service', async () => {
            const spy = jest
                .spyOn(AdminService, 'toggleActiveStatus')
                .mockRejectedValue(new Error('DB Error Toggle'));

            const res = await request(app)
                .patch(`/api/admin/toggleActive/${testUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(500);

            spy.mockRestore();
        });


        it('should handle error in updateRole service', async () => {
            const spy = jest
                .spyOn(AdminService, 'updateUserRole')
                .mockRejectedValue(new Error('DB Error Role'));

            const res = await request(app)
                .put(`/api/admin/users/${testUser._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'admin' });

            expect(res.statusCode).toBe(500);

            spy.mockRestore();
        });

        
        it('should handle error in getStats service', async () => {
            const spy = jest.spyOn(User, 'countDocuments').mockRejectedValue(new Error('DB Error Stats'));
            
            // Si tu as une route /api/admin/stats, teste la ici
            // Sinon, teste le service directement :
            await expect(AdminService.getStats()).rejects.toThrow('DB Error Stats');
            
            spy.mockRestore();
        });

        it('PATCH /admin/toggleActive/:id - Devrait persister le changement en base', async () => {
            // 1. On récupère l'état initial
            const initialUser = await User.findById(testUser._id);
            const initialStatus = initialUser.isActive;

            // 2. On appelle l'API
            await request(app)
                .patch(`/api/admin/toggleActive/${testUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            // 3. On vérifie en base que ça a bien changé
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.isActive).toBe(!initialStatus);
        });
    });
    describe('Admin Controller - Additional Coverage', () => {

        it('PUT /api/admin/users/:id/role - Devrait renvoyer 400 si le rôle est manquant', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${testUser._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({}); // On n'envoie pas de rôle

            expect(res.statusCode).toBe(400); 
        });

        it('PATCH /api/admin/toggleActive/:id - Devrait échouer avec un ID invalide', async () => {
            const res = await request(app)
                .patch('/api/admin/toggleActive/id-invalide')
                .set('Authorization', `Bearer ${adminToken}`);

            expect([400, 500]).toContain(res.statusCode);
        });
    });
});
