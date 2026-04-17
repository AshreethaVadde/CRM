const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  content: { type: String, required: true },
  subject: { type: String, default: 'Monthly Update from ShopCRM' },
  channel: { type: String, enum: ['email', 'sms', 'app'], default: 'app' },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'sent' },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
