const express = require('express');
const router = express.Router();
const { getDailyAnalytics, getRevenueChart } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { storeScope } = require('../middleware/rbacMiddleware');

router.get('/daily', protect, storeScope, getDailyAnalytics);
router.get('/chart', protect, storeScope, getRevenueChart);

module.exports = router;
