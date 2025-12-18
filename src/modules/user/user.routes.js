const express = require('express');
const router = express.Router();
const userController = require('./user.controller');

router.post('/addusers', userController.handleUserCreation);
router.get('/AllUsers', userController.handleAllUsers);
router.put('/:id', userController.editUser);
router.put('/:id/status', userController.updateUserStatus);
router.delete('/:id', userController.deletedUser);

module.exports = router;