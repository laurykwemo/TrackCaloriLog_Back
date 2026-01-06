const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../modules/user/user.model');
const nodemailer = require('nodemailer');

// Mock complet de Nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  })
}));

describe('Série de tests pour l\'authentification', () => {
  
  beforeAll(async () => {
    // On se connecte à une DB de test (différente de la prod !)
    const url = process.env.MONGO_URL_TEST || 'mongodb://127.0.0.1/trackcalorilog_test';
    await mongoose.connect(url);
  });

  afterAll(async () => {
      await mongoose.connection.dropDatabase(); // Optionnel : nettoie après passage
      await mongoose.connection.close();
  });

  // --- LOGIN AVEC SUCCÈS (JWT) ---
  it('Devrait connecter l\'utilisateur et renvoyer un token JWT', async () => {
    const email = `win_${Date.now()}@test.com`;
    // 1. Créer user
    await request(app).post('/trackcalorilog/register/registerok').send({
        name: 'Winner', email, password: 'Password123!', birthDate: '1990-01-01', sex: 1, height: 170, weight: 60
    });
    // 2. Forcer la validation d'email en base
    await User.findOneAndUpdate({ email }, { isEmailVerified: true, isActive: true });

    const res = await request(app)
      .post('/trackcalorilog/login/loginok')
      .send({ email, password: 'Password123!' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  // --- TEST FORGOT PASSWORD ---
  it('Devrait générer un token de réinitialisation', async () => {
    const email = `forgot_${Date.now()}@test.com`;
    await request(app).post('/trackcalorilog/register/registerok').send({
        name: 'Forgot', email, password: 'Password123!', birthDate: '1990-01-01', sex: 1, height: 170, weight: 60
    });

    const res = await request(app)
      .post('/trackcalorilog/forgot-password')
      .send({ email });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("envoyé");
  });

  // --- TEST RESET PASSWORD ---
  it('Devrait changer le mot de passe avec un token valide', async () => {
    const email = `reset_${Date.now()}@test.com`;
    const token = 'super-token-123';
    await request(app).post('/trackcalorilog/register/registerok').send({
        name: 'Reset', email, password: 'OldPassword123!', birthDate: '1990-01-01', sex: 1, height: 170, weight: 60
    });

    await User.findOneAndUpdate({ email }, { 
        resetPasswordToken: token, 
        resetPasswordExpires: Date.now() + 3600000 
    });

    const res = await request(app)
      .post('/trackcalorilog/reset-password')
      .send({ 
          token: token, 
          newPassword: 'NewPassword123!' // On utilise bien newPassword ici
      });

    expect(res.statusCode).toBe(200);
  });

  // --- TESTS D'ERREURS POUR LE 100% COVERAGE ---
  it('Devrait renvoyer 401 et renvoyer un mail si l\'email n\'est pas vérifié', async () => {
    const email = `unverified_${Date.now()}@test.com`;
    await request(app).post('/trackcalorilog/register/registerok').send({
        name: 'NoVerify', email, password: 'Password123!', birthDate: '1990-01-01', sex: 1, height: 170, weight: 60
    });

    const res = await request(app)
      .post('/trackcalorilog/login/loginok')
      .send({ email, password: 'Password123!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain("Un nouveau lien vient de vous être envoyé");
  });

  it('Devrait échouer au reset si le token est inconnu', async () => {
    const res = await request(app)
      .post('/trackcalorilog/reset-password')
      .send({ token: 'fake', newPassword: 'Password123!' });
    expect(res.statusCode).toBe(400);
  });
  it('Login : devrait échouer si l\'utilisateur n\'existe pas', async () => {
    const res = await request(app)
      .post('/trackcalorilog/login/loginok')
      .send({ email: 'fantome@test.com', password: 'Password123!' });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Identifiants incorrects');
  });

  it('Login : devrait échouer si le mot de passe est faux', async () => {
    const email = `wrongpass_${Date.now()}@test.com`;
    await request(app).post('/trackcalorilog/register/registerok').send({
        name: 'User', email, password: 'CorrectPassword123!', birthDate: '1990-01-01', sex: 1, height: 170, weight: 60
    });
    // On valide l'email en base pour passer les premiers checks
    await User.findOneAndUpdate({ email }, { isEmailVerified: true });

    const res = await request(app)
      .post('/trackcalorilog/login/loginok')
      .send({ email, password: 'WrongPassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Identifiants incorrects');
  });

  it('Login : devrait bloquer le compte après 5 tentatives', async () => {
    const email = `brute_${Date.now()}@test.com`;
    await request(app).post('/trackcalorilog/register/registerok').send({
        name: 'Brute', email, password: 'Password123!', birthDate: '1990-01-01', sex: 1, height: 170, weight: 60
    });
    await User.findOneAndUpdate({ email }, { isEmailVerified: true });

    // On simule 5 échecs
    for(let i = 0; i < 5; i++) {
        await request(app).post('/trackcalorilog/login/loginok').send({ email, password: 'BAD' });
    }

    const res = await request(app)
      .post('/trackcalorilog/login/loginok')
      .send({ email, password: 'BAD' });

    expect(res.body.message).toMatch(/Compte bloqué/i);
  });
  it('should return 400 for a malformed or invalid token', async () => {
      const res = await request(app)
          .post('/trackcalorilog/reset-password')
          .send({
              token: 'token-completement-invalide',
              newPassword: 'NewPassword123!'
          });

      expect(res.status).toBe(400);
      // Vérifie que le message correspond à ta logique (ex: "Token invalide ou expiré")
  });

  it('should return 400 when password field is missing', async () => {
      const res = await request(app)
          .post('/trackcalorilog/reset-password')
          .send({
              token: 'un-token-de-test-valide'
              // newPassword manquant
          });

      expect(res.status).toBe(400);
  });
});
