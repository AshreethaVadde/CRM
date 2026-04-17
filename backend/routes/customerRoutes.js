const express = require('express');
const router = express.Router();
const { 
  getCustomers, getCustomerById, getCustomerProfile,
  createCustomer, updateCustomer, deleteCustomer,
  getSegments, getInactiveCustomers
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const { storeScope } = require('../middleware/rbacMiddleware');

router.get('/segments', protect, storeScope, getSegments);
router.get('/inactive', protect, storeScope, getInactiveCustomers);

router.route('/')
  .get(protect, storeScope, getCustomers)
  .post(protect, storeScope, createCustomer);

router.get('/:id/profile', protect, getCustomerProfile);

router.route('/:id')
  .get(protect, getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

module.exports = router;
