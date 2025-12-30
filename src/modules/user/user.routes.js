const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { isAdmin,  isAuthenticated} = require('../../middlewares/authMiddleware');

router.post('/addusers', userController.handleUserCreation);
router.get('/AllUsers', isAuthenticated, userController.handleAllUsers);
router.put('/:id', userController.editUser);
router.put('/:id/status', userController.updateUserStatus);
router.delete('/:id', userController.deletedUser);

module.exports = router;