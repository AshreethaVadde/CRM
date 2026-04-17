const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const Notification = require('../models/Notification');

// Helper: broadcast via Socket.IO (attached to app by server.js)
const emitNotification = (req, notif) => {
  try {
    const io = req.app.get('io');
    if (io) io.emit('notification', notif);
  } catch (e) { /* silent */ }
};

const generateBill = async (req, res) => {
  const { customerId, items, usePoints, campaignDiscount, storeId } = req.body;

  if (!customerId || !items || items.length === 0) {
    return res.status(400).json({ message: 'Customer ID and items are required' });
  }

  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Calculate subtotal
    let subtotal = 0;
    items.forEach(item => {
      subtotal += (item.price || 0) * (item.quantity || 1);
    });

    // Apply campaign discount (percentage)
    const campaignDiscountAmount = campaignDiscount
      ? Math.floor((subtotal * campaignDiscount) / 100)
      : 0;

    // Apply reward points (each point = ₹1 value, max 50% of bill)
    let pointsUsed = 0;
    let discountFromPoints = 0;
    const maxPointDiscount = Math.floor((subtotal - campaignDiscountAmount) * 0.5);

    if (usePoints && customer.rewardPoints > 0) {
      pointsUsed = Math.min(customer.rewardPoints, maxPointDiscount);
      discountFromPoints = pointsUsed;
    }

    // Final total
    const total = Math.max(0, subtotal - campaignDiscountAmount - discountFromPoints);

    // Earn 1 point per ₹50 spent (on actual amount paid)
    const pointsEarned = Math.floor(total / 50);

    // Detect state before save (for tier/VIP notifications)
    const prevSegment = customer.segment;
    const prevTier = customer.loyaltyTier;

    // Update customer
    customer.totalSpending += total;
    customer.visits += 1;
    customer.rewardPoints = customer.rewardPoints - pointsUsed + pointsEarned;
    customer.lastVisitDate = Date.now();

    // Update preferred categories
    const cats = items.map(i => i.category).filter(Boolean);
    const uniqueCats = [...new Set([...(customer.preferredCategories || []), ...cats])].slice(0, 5);
    customer.preferredCategories = uniqueCats;

    // Recompute segment & tier
    const { segment: newSegment, loyaltyTier: newTier } = customer.computeSegment();
    await customer.save();

    // Save bill record
    const bill = await Bill.create({
      customerId,
      storeId: storeId || req.user?.storeId || null,
      items,
      subtotal,
      pointsUsed,
      discountFromPoints,
      campaignDiscount: campaignDiscountAmount,
      total,
      pointsEarned,
      createdBy: req.user?._id || null
    });

    // Emit Socket.IO notifications if thresholds crossed
    if (prevSegment !== 'VIP' && newSegment === 'VIP') {
      const notif = await Notification.create({
        type: 'vip_upgrade',
        title: '⭐ New VIP Customer!',
        message: `${customer.name} has become a VIP customer with ₹${customer.totalSpending.toLocaleString()} total spending!`,
        customerId: customer._id,
        storeId: storeId || null
      });
      emitNotification(req, notif);
    }

    if (prevTier !== newTier) {
      const notif = await Notification.create({
        type: 'tier_upgrade',
        title: `🏆 Loyalty Tier Upgrade`,
        message: `${customer.name} upgraded from ${prevTier} to ${newTier} tier!`,
        customerId: customer._id,
        storeId: storeId || null
      });
      emitNotification(req, notif);
    }

    res.status(200).json({
      message: 'Bill generated successfully',
      billId: bill._id,
      subtotal,
      campaignDiscountAmount,
      pointsUsed,
      discountFromPoints,
      billTotal: total,
      pointsEarned,
      customer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBillsByCustomer = async (req, res) => {
  try {
    const bills = await Bill.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBills = async (req, res) => {
  try {
    const filter = req.storeFilter || {};
    const bills = await Bill.find(filter)
      .populate('customerId', 'name phone segment')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateBill, getBillsByCustomer, getAllBills };
