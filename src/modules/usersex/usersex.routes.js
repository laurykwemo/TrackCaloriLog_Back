const express = require('express');
const router = express.Router();
const userSexController = require('./usersex.controller');

router.post('/addsexes', userSexController.handleSexCreation);
router.get('/AllSexes', userSexController.handleAllSexes);

module.exports = router;