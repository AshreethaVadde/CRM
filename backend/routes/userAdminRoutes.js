const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userAdminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/rbacMiddleware');

router.route('/')
  .get(protect, isAdmin, getAllUsers)
  .post(protect, isAdmin, createUser);

router.route('/:id')
  .put(protect, isAdmin, updateUser)
  .delete(protect, isAdmin, deleteUser);

module.exports = router;
