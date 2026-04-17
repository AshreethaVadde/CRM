const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['vip_upgrade', 'tier_upgrade', 'inactive_alert', 'campaign', 'general'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  isRead: { type: Boolean, default: false },
  isGlobal: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
