const express = require('express');
const router = express.Router();
const {
  getCampaigns, getCampaignById, createCampaign,
  updateCampaign, deleteCampaign, getActiveCampaigns
} = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');
const { isAdminOrManager, storeScope } = require('../middleware/rbacMiddleware');

router.get('/active', protect, storeScope, getActiveCampaigns);

router.route('/')
  .get(protect, storeScope, getCampaigns)
  .post(protect, isAdminOrManager, storeScope, createCampaign);

router.route('/:id')
  .get(protect, getCampaignById)
  .put(protect, isAdminOrManager, updateCampaign)
  .delete(protect, isAdminOrManager, deleteCampaign);

module.exports = router;
