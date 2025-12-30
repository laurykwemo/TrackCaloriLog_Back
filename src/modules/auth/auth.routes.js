const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.post('/register/registerok', authController.register);
router.post('/login/loginok', authController.login);
router.get('/me', authMiddleware.isAuthenticated, authController.me);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.handlePasswordReset);

module.exports = router;
