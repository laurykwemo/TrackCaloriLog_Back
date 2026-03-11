const express = require('express');
const router = express.Router();
const userSexController = require('./usersex.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/AllSexes', userSexController.handleAllSexes);
router.post('/addsexes', userSexController.handleSexCreation);

module.exports = router;