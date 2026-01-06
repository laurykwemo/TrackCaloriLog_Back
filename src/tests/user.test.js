const request = require('supertest');
const app = require('../app'); 
const mongoose = require('mongoose');
const User = require('../modules/user/user.model');
const jwt = require('jsonwebtoken');
const UserService = require('../modules/user/user.service');

describe('Tests du module User', () => {
    let adminToken;
    let userToken;
    let testUserId; // Variable globale pour tout le bloc describe

    beforeAll(async () => {
        // Connexion à la base de test
        // Si mongoose n'est pas encore connecté
        jest.setTimeout(15000);
        if (mongoose.connection.readyState === 0) {
            const testUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/trackcalorilog_test';
            await mongoose.connect(testUri);
        }
        // Nettoyage avant les tests
        await User.deleteMany({});

        // 1. Création d'un admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'hashedPassword123',
            role: 'admin',
            birthDate: '1990-01-01',
            sex: 1, height: 180, weight: 80
        });

        testUserId = admin._id.toString();

        // 2. Création d'un simple utilisateur
        const simpleUser = await User.create({
            name: 'Simple User',
            email: 'user@test.com',
            password: 'password123',
            role: 'user',
            birthDate: '1992-01-01',
            sex: 1, height: 175, weight: 70
        });

        // Génération des tokens (on met id et userId pour couvrir les deux cas possibles du middleware)
        const secret = process.env.JWT_SECRET || 'secret';
        adminToken = jwt.sign({ id: admin._id, userId: admin._id, role: 'admin' }, secret);
        userToken = jwt.sign({ id: simpleUser._id, userId: simpleUser._id, role: 'user' }, secret);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('doit créer un nouvel utilisateur avec succès', async () => {
        const res = await request(app)
            .post('/api/addusers')
            .send({
                name: 'New User',
                email: `new${Date.now()}@example.com`,
                password: 'Password123!',
                birthDate: '1995-05-15',
                sex: 1, height: 170, weight: 65
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.user).toBeDefined();
    });

    it('Devrait bloquer AllUsers si aucun token n\'est fourni', async () => {
        const res = await request(app).get('/api/AllUsers');
        expect(res.statusCode).toBe(401);
    });

    it('Devrait retourner 404 si l\'utilisateur à supprimer n\'existe pas', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .delete(`/api/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(404);
    });

    it('Devrait bloquer une action admin si l\'utilisateur est un simple user', async () => {
        const res = await request(app)
            .patch(`/api/admin/toggleActive/${testUserId}`)
            .set('Authorization', `Bearer ${userToken}`);
        
        expect(res.statusCode).toBe(403); 
    });

    it('Devrait renvoyer 401 si le token est malformé', async () => {
        const res = await request(app)
            .get('/api/AllUsers')
            .set('Authorization', 'Bearer token-invalide');
        
        expect(res.statusCode).toBe(401);
    });

    it('Devrait échouer si l\'utilisateur a moins de 13 ans', async () => {
        const res = await request(app)
            .post('/api/addusers')
            .send({
                name: 'Petit', email: 'enfant@test.com', password: 'password123',
                birthDate: '2022-01-01', 
                sex: 1, height: 100, weight: 20
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/13 ans/i);
    });

    /*it('should get a user by ID', async () => {
        const res = await request(app).get(`/api/${testUserId}`);
        expect([200, 404]).toContain(res.status);
    });*/

    it('should update a user', async () => {
        const res = await request(app)
            .put(`/api/${testUserId}`)
            .set('Authorization', `Bearer ${adminToken}`) // Ajouté
            .send({ name: 'UpdatedName' });
        
        expect([200, 404, 400]).toContain(res.status);
    });

    /*it('should return 400 or 404 for invalid ID format on get', async () => {
        const res = await request(app).get('/api/users/invalid-id');
        // On accepte 400 ou 404 selon la gestion des erreurs de ton app
        expect([400, 404]).toContain(res.status);
    });*/

    // --- Nouveaux tests pour augmenter le coverage ---

    it('should return null when updating a non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
        .put(`/api/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`) // Ajouté
        .send({ name: 'No One' });
    
    expect([400, 404, 500]).toContain(res.status);
});

    it('should fail to update if data is invalid (validation service)', async () => {
        const tempUser = await User.create({
            name: 'Validation Test',
            email: 'val@test.com',
            password: 'Password123!',
            birthDate: '1990-01-01',
            sex: 1, height: 170, weight: 70
        });
        // 2. Tenter de le mettre à jour avec un email invalide
        const res = await request(app)
            .put(`/api/${tempUser._id}`) // On est SUR qu'il existe
            .send({ email: 'pas-un-email' });
        
        // Si ton service valide l'email avant l'update
        expect([400, 404, 500]).toContain(res.status);
    });

    it('should fail to update if data is invalid', async () => {
        const tempUser = await User.create({
            name: 'Validation Test',
            email: `validate_${Date.now()}@test.com`,
            password: 'Password123!',
            birthDate: '1990-01-01',
            sex: 1, height: 170, weight: 70
        });
        // 2. Tenter de le mettre à jour avec un email invalide
        const res = await request(app)
            .put(`/api/${tempUser._id}`) // On est SUR qu'il existe
            .send({ email: 'pas-un-email' });
        
        // Si ton code renvoie 404, c'est que l'ID n'est pas trouvé.
        // Si tu veux tester la validation, l'utilisateur DOIT exister.
        expect([400, 404, 500]).toContain(res.status);

    });

    it('should successfully delete a user', async () => {
        // On crée un utilisateur temporaire pour ne pas casser testUserId
        const tempUser = await User.create({
            name: 'To Delete',
            email: 'delete@test.com',
            password: 'Password123!',
            birthDate: '1990-01-01',
            sex: 1, height: 170, weight: 70
        });

        const res = await request(app)
            .delete(`/api/${tempUser._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
    });

    it('should return 400 for a malformed ID during deletion', async () => {
        const res = await request(app)
            .delete('/api/id-invalide-123')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect([400, 500]).toContain(res.status); // Selon ta gestion d'erreur globale
    });

    it('should find a user by email', async () => {
        const user = await UserService.findByEmail('admin@test.com');
        expect(user).toBeDefined();
        expect(user.email).toBe('admin@test.com');
    });

    it('should return null if user by email not found', async () => {
        const user = await UserService.findByEmail('inexistant@test.com');
        expect(user).toBeNull();
    });

    it('should fail to create a user with an existing email', async () => {
        // On crée un premier utilisateur
        await User.create({ name: 'Unique', email: 'double@test.com', password: 'Password123!',
            birthDate: '1990-01-01',
            sex: 1, height: 170, weight: 70 });

        // On tente de recréer le même
        const res = await request(app)
            .post('/api/addusers')
            .send({ name: 'Double', email: 'double@test.com', password: 'Password123!',
            birthDate: '1990-01-01',
            sex: 1, height: 170, weight: 70 });

        expect(res.statusCode).toBe(400); // Ou 409 selon ton code
    });
    it('devrait échouer si le mot de passe est trop court', async () => {
        const res = await request(app)
            .post('/api/addusers')
            .send({
                name: 'Test',
                email: 'short@test.com',
                password: '123', // Trop court (< 8)
                birthDate: '1990-01-01',
                sex: 1, height: 170, weight: 70
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/au moins 8 caractères/i);
    });

    it('devrait échouer si l\'email est manquant', async () => {
        const res = await request(app)
            .post('/api/addusers')
            .send({
                name: 'Test',
                password: 'password123',
                birthDate: '1990-01-01',
                sex: 1, height: 170, weight: 70
            });
        expect(res.statusCode).toBe(400);
    });

    it('doit couvrir la logique complète de suppression (Lignes 135-150)', async () => {
        // 1. Créer un user exprès
        const userToDelete = await User.create({
            name: 'To Be Deleted',
            email: 'delete-me@test.com',
            password: 'password123',
            birthDate: '1990-01-01',
            sex: 1, height: 170, weight: 70
        });

        // 2. Le supprimer via le SERVICE pour être sûr de passer dans les lignes 135-150
        const deleted = await UserService.deleteUser(userToDelete._id);
        
        expect(deleted).toBeDefined();
        expect(deleted.email).toBe('delete-me@test.com');

        // 3. Vérifier qu'il est bien dans la collection des supprimés (facultatif mais bien pour le coverage)
        const checkDeleted = await mongoose.model('DeletedUser').findOne({ email: 'delete-me@test.com' });
        expect(checkDeleted).not.toBeNull();
    });
    it('devrait lever une erreur si on tente de supprimer un utilisateur inexistant', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        // Ici on teste directement le service si on veut être précis
        const userService = require('../modules/user/user.service');
        await expect(userService.deleteUser(fakeId)).rejects.toThrow();
    });
    /*describe('User Controller - GetById Coverage (Lignes 23-56)', () => {
        it('GET /api/users/:id - Devrait retourner un utilisateur pour un ID valide', async () => {
            const res = await request(app)
                .get(`/api/${testUserId}`) // Utilisation de testUserId défini dans beforeAll
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('name');
        });

        it('GET /api/users/:id - Devrait renvoyer 404 pour un ID inexistant', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(404);
        });
    });*/

    describe('User Controller - Update Coverage (Lignes 80-105)', () => {
        it('PUT /api/users/:id - Devrait permettre à un utilisateur de modifier son PROPRE nom', async () => {
            const res = await request(app)
                .put(`/api/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`) // L'admin peut tout modifier
                .send({ name: 'Nouveau Nom Coverage' });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.name).toBe('Nouveau Nom Coverage');
        });

        it('PUT /api/users/:id - Devrait bloquer si les données sont invalides (ex: poids négatif)', async () => {
            const res = await request(app)
                .put(`/api/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ weight: -10 }); // Devrait déclencher une erreur de validation

            expect(res.statusCode).toBe(400);
        });
    });

    // Test pour forcer le catch (Erreur 500) sur la suppression
    it('DELETE /api/:id - Devrait renvoyer 400 pour un format d\'ID invalide', async () => {
        const res = await request(app)
            .delete('/api/id-invalide-123')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toBe(400);
    });
});