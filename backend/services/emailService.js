const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.fromAddress = process.env.SMTP_FROM || 'no-reply@shopcrm.com';
    this.isConfigured = false;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        this.isConfigured = true;
      } catch (err) {
        console.error('Nodemailer init error:', err.message);
      }
    } else {
      console.warn('⚠️ SMTP variables missing. Email service running in graceful mock mode.');
    }
  }

  async sendEmail(to, subject, text, html = '') {
    if (!this.isConfigured) {
      console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text,
        html: html || text // fallback
      });
      console.log(`✅ [EMAIL SENT] ID: ${info.messageId} to ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ [EMAIL FAILED] To: ${to}. Error:`, error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
