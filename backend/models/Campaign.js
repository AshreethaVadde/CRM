const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Discount', 'Festive', 'Loyalty', 'Winback', 'General'], default: 'General' },
  targetSegment: { type: String, enum: ['All', 'VIP', 'Frequent', 'Inactive', 'New', 'Occasional'], default: 'All' },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  message: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Active', 'Ended'], default: 'Draft' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: null },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Performance tracking
  totalTargeted: { type: Number, default: 0 },
  totalRedeemed: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
