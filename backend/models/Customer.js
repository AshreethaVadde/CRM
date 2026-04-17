const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // Core Fields (preserved)
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  tags: { type: String, default: 'Normal' },
  notes: { type: String, default: '' },
  totalSpending: { type: Number, default: 0 },
  visits: { type: Number, default: 0 },
  rewardPoints: { type: Number, default: 0 },
  lastVisitDate: { type: Date, default: Date.now },

  // NEW: Multi-store
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },

  // NEW: Segmentation
  segment: { 
    type: String, 
    enum: ['VIP', 'Frequent', 'Inactive', 'New', 'Occasional', 'Regular'],
    default: 'New'
  },

  // NEW: Loyalty Tier
  loyaltyTier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },

  // NEW: Last message date for monthly messaging
  lastMessageSentAt: { type: Date, default: null },
  lastInactivityMessageSentAt: { type: Date, default: null },

  // NEW: Preferred categories (derived from purchase history)
  preferredCategories: [{ type: String }],

  // NEW: purchase history reference (bills stored in Bill model)
  // Accessed via populate on Bill model
}, { timestamps: true });

// Auto compute segment based on spending + visits + lastVisit
customerSchema.methods.computeSegment = function () {
  const daysSinceVisit = (Date.now() - new Date(this.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24);

  if (this.totalSpending >= 5000) {
    this.segment = 'VIP';
  } else if (daysSinceVisit > 3) {
    this.segment = 'Inactive';
  } else if (this.visits >= 5) {
    this.segment = 'Frequent';
  } else if (this.visits <= 1) {
    this.segment = 'New';
  } else if (this.visits <= 3) {
    this.segment = 'Occasional';
  } else {
    this.segment = 'Regular';
  }

  // Loyalty tier by spending
  if (this.totalSpending >= 20000) this.loyaltyTier = 'Platinum';
  else if (this.totalSpending >= 10000) this.loyaltyTier = 'Gold';
  else if (this.totalSpending >= 3000) this.loyaltyTier = 'Silver';
  else this.loyaltyTier = 'Bronze';

  return { segment: this.segment, loyaltyTier: this.loyaltyTier };
};

module.exports = mongoose.model('Customer', customerSchema);
