const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../modules/user/user.model');
const DeletedUser = require('../modules/deleteduser/deleteduser.model');
const jwt = require('jsonwebtoken');

describe('DeletedUser Module Tests', () => {
    let adminToken;
    let archivedUserId;

    beforeAll(async () => {
        // Si mongoose n'est pas encore connecté
        if (mongoose.connection.readyState === 0) {
            const testUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/trackcalorilog_test';
            await mongoose.connect(testUri);
        }
        // Nettoyage avant les tests
        await User.deleteMany({});
        await DeletedUser.deleteMany({});

        // Création d'un admin pour l'authentification
        const admin = await User.create({
            name: 'Admin Test',
            email: 'admin@test.com',
            password: 'Password123!',
            role: 'admin',
            birthDate: '1980-01-01',
            sex: 1, height: 180, weight: 80
        });
        adminToken = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'votre_jwt_secret');

        // On pré-crée un utilisateur dans la table "DeletedUser" pour tester les routes GET, PUT, DELETE
        const archived = await DeletedUser.create({
            originalUserId: new mongoose.Types.ObjectId(),
            name: 'Old User',
            email: 'old@test.com',
            password: 'Password123!',
            birthDate: '1990-01-01',
            sex: 1,
            role: 'user', 
            height: 180, 
            weight: 80
        });
        archivedUserId = archived._id;
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase(); // Optionnel : nettoie après passage
        await mongoose.connection.close();
    });

    // --- Tests des Routes ---

    it('GET /api/deletedusers - Devrait récupérer tous les supprimés', async () => {
        const res = await request(app)
            .get('/api/deletedusers')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /api/deletedusers/:id - Devrait récupérer un utilisateur spécifique', async () => {
        const res = await request(app)
            .get(`/api/deletedusers/${archivedUserId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Old User');
    });

    it('PUT /api/deletedusers/:id - Devrait modifier un utilisateur archivé', async () => {
        const res = await request(app)
            .put(`/api/deletedusers/${archivedUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Updated Name' });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Updated Name');
    });

    it('POST /api/deletedusers/restore/:id - Devrait restaurer un utilisateur', async () => {
        // On crée un nouvel utilisateur archivé exprès pour la restauration
        const toRestore = await DeletedUser.create({
            originalUserId: new mongoose.Types.ObjectId(),
            name: 'Restorable',
            email: 'restore@test.com',
            password: 'Password123!',
            birthDate: '1990-01-01',
            sex: 1,
            role: 'user', 
            height: 180, 
            weight: 80
        });

        const res = await request(app)
            .post(`/api/deletedusers/restore/${toRestore._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Utilisateur restauré');

        // Vérifier qu'il est revenu dans la table User
        const found = await User.findOne({ email: 'restore@test.com' });
        expect(found).not.toBeNull();
    });

    it('DELETE /api/deletedusers/:id - Devrait supprimer définitivement', async () => {
        const res = await request(app)
            .delete(`/api/deletedusers/${archivedUserId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Utilisateur supprimé définitivement');

        // Vérifier qu'il n'existe plus du tout
        const found = await DeletedUser.findById(archivedUserId);
        expect(found).toBeNull();
    });

    it('Devrait renvoyer 404 pour un ID inexistant sur la restauration', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .post(`/api/deletedusers/restore/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(404);
    });
});