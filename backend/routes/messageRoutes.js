const express = require('express');
const router = express.Router();
const { sendMessage, sendMonthlyMessages, getMonthlyStatus, getCustomerMessages, getAllMessages, getBulkInactiveStatus, sendBulkInactiveOffers } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { isAdminOrManager } = require('../middleware/rbacMiddleware');

router.post('/send', protect, sendMessage);
router.post('/send-monthly', protect, isAdminOrManager, sendMonthlyMessages);
router.get('/monthly-status', protect, isAdminOrManager, getMonthlyStatus);
router.post('/send-inactive-bulk', protect, isAdminOrManager, sendBulkInactiveOffers);
router.get('/inactive-bulk-status', protect, isAdminOrManager, getBulkInactiveStatus);
router.get('/customer/:customerId', protect, getCustomerMessages);
router.get('/all', protect, isAdminOrManager, getAllMessages);

module.exports = router;
