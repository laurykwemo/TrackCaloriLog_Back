const express = require('express');
const router = express.Router();
const deletedUserController = require('./deleteduser.controller');

router.get('/deletedusers', deletedUserController.getAllDeletedUsers);
router.get('/deletedusers/:id', deletedUserController.getDeletedUserById);
router.delete('/deletedusers/:id', deletedUserController.deletePermanently);
router.post('/deletedusers/restore/:id', deletedUserController.restoreDeletedUser);
router.put('/deletedusers/:id', deletedUserController.editUser);


module.exports = router;
