const mongoose = require('mongoose');

// Stores global app-level settings like lastMonthlyEmailSent
const appSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('AppSettings', appSettingsSchema);
