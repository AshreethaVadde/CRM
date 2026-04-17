const express = require('express');
const router = express.Router();
const { getStores, getStoreById, createStore, updateStore, deleteStore } = require('../controllers/storeController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/rbacMiddleware');

router.route('/')
  .get(protect, getStores)
  .post(protect, isAdmin, createStore);

router.route('/:id')
  .get(protect, getStoreById)
  .put(protect, isAdmin, updateStore)
  .delete(protect, isAdmin, deleteStore);

module.exports = router;
