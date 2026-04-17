const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = null;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.isConfigured = false;

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        this.isConfigured = true;
      } catch (err) {
        console.error('Twilio init error:', err.message);
      }
    } else {
      console.warn('⚠️ Twilio variables missing. SMS service running in graceful mock mode.');
    }
  }

  async sendSMS(to, body) {
    if (!this.isConfigured) {
      console.log(`[SMS MOCK] To: ${to} | Body: ${body}`);
      return false; // Return false to indicate it wasn't really sent (fallback)
    }

    try {
      const message = await this.client.messages.create({
        body,
        from: this.phoneNumber,
        to
      });
      console.log(`✅ [SMS SENT] SID: ${message.sid} to ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ [SMS FAILED] To: ${to}. Error:`, error.message);
      return false; // Real failure
    }
  }
}

module.exports = new SMSService();
