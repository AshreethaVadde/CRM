const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');

const getCampaigns = async (req, res) => {
  try {
    const filter = req.storeFilter || {};
    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('createdBy', 'name');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCampaign = async (req, res) => {
  try {
    const { name, type, targetSegment, discountPercent, message, startDate, endDate } = req.body;
    if (!name) return res.status(400).json({ message: 'Campaign name is required' });

    // Count how many customers are targeted
    const customerFilter = req.storeFilter || {};
    let totalTargeted = 0;
    if (targetSegment && targetSegment !== 'All') {
      totalTargeted = await Customer.countDocuments({ ...customerFilter, segment: targetSegment });
    } else {
      totalTargeted = await Customer.countDocuments(customerFilter);
    }

    const campaign = await Campaign.create({
      name, type, targetSegment, discountPercent, message, startDate, endDate,
      status: 'Active',
      storeId: req.user?.storeId || null,
      createdBy: req.user._id,
      totalTargeted
    });

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    Object.assign(campaign, req.body);
    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    await campaign.deleteOne();
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active campaigns for billing (for Staff to apply discount)
const getActiveCampaigns = async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      ...(req.storeFilter || {}),
      status: 'Active',
      $or: [{ endDate: null }, { endDate: { $gte: now } }]
    };
    const campaigns = await Campaign.find(filter);
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign, getActiveCampaigns };
