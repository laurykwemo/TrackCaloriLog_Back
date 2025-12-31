const request = require('supertest');
const app = require('../app'); // On importe l'app SANS lancer le serveur

describe('Vérification des routes de base', () => {
    
    it('doit charger la page d accueil', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
    });

    it('doit charger la page de login', async () => {
        const res = await request(app).get('/trackcalorilog/login');
        expect(res.statusCode).toBe(200);
    });

    it('doit retourner 404 pour une route inconnue', async () => {
        const res = await request(app).get('/api/existe-pas');
        expect(res.statusCode).toBe(404);
    });
});