const express = require('express');
const router = express.Router();
const { getNotifications, getUnreadCount, markAllRead, markRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { storeScope } = require('../middleware/rbacMiddleware');

router.get('/', protect, storeScope, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/mark-all-read', protect, markAllRead);
router.put('/:id/read', protect, markRead);

module.exports = router;
