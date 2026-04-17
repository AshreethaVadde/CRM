const express = require('express');
const router = express.Router();
const { generateBill, getBillsByCustomer, getAllBills } = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');
const { storeScope } = require('../middleware/rbacMiddleware');

router.post('/', protect, storeScope, generateBill);
router.get('/', protect, storeScope, getAllBills);
router.get('/customer/:customerId', protect, getBillsByCustomer);

module.exports = router;
