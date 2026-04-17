const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  category: { type: String, default: 'General' }
}, { _id: false });

const billSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  items: [billItemSchema],
  subtotal: { type: Number, required: true },
  pointsUsed: { type: Number, default: 0 },
  discountFromPoints: { type: Number, default: 0 },
  campaignDiscount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  pointsEarned: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
