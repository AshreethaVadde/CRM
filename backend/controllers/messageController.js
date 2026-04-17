const Message = require('../models/Message');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');
const AppSettings = require('../models/AppSettings');
const emailService = require('../services/emailService');

// Helper: check if monthly emails were already sent this calendar month
const getMonthlyEmailRecord = async () => {
  return AppSettings.findOne({ key: 'lastMonthlyEmailSent' });
};

const isSameMonth = (date) => {
  if (!date) return false;
  const now = new Date();
  const d = new Date(date);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

// GET /messages/monthly-status — frontend calls this on load
const getMonthlyStatus = async (req, res) => {
  try {
    const record = await getMonthlyEmailRecord();
    const lastSent = record?.value || null;
    const alreadySentThisMonth = isSameMonth(lastSent);

    // Calculate when next month starts
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    res.json({
      lastSent,
      alreadySentThisMonth,
      nextAvailableDate: nextMonth.toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /messages/inactive-bulk-status — frontend calls this on load
const getBulkInactiveStatus = async (req, res) => {
  try {
    const record = await AppSettings.findOne({ key: 'lastBulkOfferSentDate' });
    const lastSent = record?.value || null;
    let onCooldown = false;
    let nextAvailableDate = null;

    if (lastSent) {
      const daysSince = (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 15) {
        onCooldown = true;
        nextAvailableDate = new Date(new Date(lastSent).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    res.json({ lastSent, onCooldown, nextAvailableDate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /messages/send-inactive-bulk — Single bulk click to handle ALL inactive customers safely
const sendBulkInactiveOffers = async (req, res) => {
  try {
    // 1. Guard check cooldown
    const record = await AppSettings.findOne({ key: 'lastBulkOfferSentDate' });
    if (record?.value) {
      const daysSince = (Date.now() - new Date(record.value).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 15) {
        const nextAvail = new Date(new Date(record.value).getTime() + 15 * 24 * 60 * 60 * 1000);
        return res.status(400).json({
          onCooldown: true,
          message: 'Bulk offers already sent recently. You can resend after 15 days.',
          nextAvailableDate: nextAvail.toISOString()
        });
      }
    }

    // 2. Compute inactive customers manually
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const customers = await Customer.find({
      $and: [
        { lastVisitDate: { $lte: threeDaysAgo } },
        { email: { $exists: true, $ne: '' } },
        {
          $or: [
            { lastInactivityMessageSentAt: null },
            { $expr: { $lt: ["$lastInactivityMessageSentAt", "$lastVisitDate"] } }
          ]
        }
      ]
    });

    if (customers.length === 0) {
      return res.status(404).json({ message: 'No uncontacted inactive customers found with valid emails.', uncontacted: 0 });
    }

    let sentCount = 0;
    let failedCount = 0;
    let errors = [];

    // 3. Process loop safely via SMTP with short cooldown
    for (const customer of customers) {
      try {
        const body = `Hi ${customer.name},\n\nWe miss you! It's been a while since your last visit. Come back and enjoy exclusive offers just for you. 🎁\n\n— ShopCRM Team`;
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h2 style="color:#14b8a6;font-size:24px;margin:0;">ShopCRM</h2>
            </div>
            <h2 style="color:#14b8a6;font-size:20px;">We Miss You! 🎁</h2>
            <p>${body.replace(/\n\n/g, '</p><p>')}</p>
            ${customer.rewardPoints > 0 ? `<div style="margin:24px 0;padding:16px;background:#1e293b;border-radius:10px;border-left:4px solid #14b8a6;"><p style="color:#94a3b8;margin:0;font-size:13px;">💎 You have <strong style="color:#f59e0b;">${customer.rewardPoints} loyalty points</strong> waiting to be redeemed!</p></div>` : ''}
            <p style="margin-top:20px;font-size:12px;color:#64748b;">— Premium Customer Management</p>
          </div>`;
          
        const isSuccess = await emailService.sendEmail(customer.email, 'We Miss You! Come Back for Exclusive Offers 🎁', body, html);
        
        await Message.create({ customerId: customer._id, content: body, subject: 'We Miss You!', channel: 'email', status: isSuccess ? 'sent' : 'failed' });

        if (isSuccess) {
          customer.lastInactivityMessageSentAt = new Date();
          await customer.save();
          sentCount++;
        } else {
          failedCount++;
          errors.push(customer.email);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        failedCount++;
        errors.push(customer.email);
      }
    }

    // 4. Record global bulk hit to AppSettings to start Cooldown across dashboard reload
    await AppSettings.findOneAndUpdate(
      { key: 'lastBulkOfferSentDate' },
      { key: 'lastBulkOfferSentDate', value: new Date() },
      { upsert: true, new: true }
    );

    const nextAvailableDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    res.json({
      success: true,
      processed: customers.length,
      sent: sentCount,
      failed: failedCount,
      nextAvailableDate,
      message: `Bulk offer processed: ${sentCount} sent, ${failedCount} failed.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /messages/send — send a single win-back email to one customer
const sendMessage = async (req, res) => {
  try {
    const { customerId, content, subject } = req.body;
    if (!customerId || !content) {
      return res.status(400).json({ message: 'Customer ID and content are required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (!customer.email) {
      return res.status(400).json({ message: 'Customer has no email address on record' });
    }
    
    // 15 Days Rule
    if (customer.lastInactivityMessageSentAt) {
      const daysSinceOffer = (Date.now() - new Date(customer.lastInactivityMessageSentAt).getTime()) / (1000 * 60 * 60 * 24);
      const visitedSinceOffer = new Date(customer.lastVisitDate) > new Date(customer.lastInactivityMessageSentAt);
      
      if (!visitedSinceOffer && daysSinceOffer < 15) {
        return res.status(400).json({ message: `Cannot send offer yet. Wait ${Math.ceil(15 - daysSinceOffer)} more days.` });
      }
    }

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#14b8a6;font-size:24px;margin:0;">ShopCRM</h2>
          <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Premium Customer Management</p>
        </div>
        <h3 style="color:#f1f5f9;font-size:20px;">We Miss You! 🎁</h3>
        <p style="color:#cbd5e1;line-height:1.7;font-size:15px;">${content}</p>
        <div style="margin:24px 0;padding:16px;background:#1e293b;border-radius:10px;border-left:4px solid #14b8a6;">
          <p style="color:#94a3b8;margin:0;font-size:13px;">💎 You have <strong style="color:#f59e0b;">${customer.rewardPoints || 0} loyalty points</strong> waiting to be redeemed!</p>
        </div>
        <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
        <p style="color:#475569;font-size:11px;text-align:center;">ShopCRM · This is an automated message, please do not reply.</p>
      </div>
    `;

    const isSuccess = await emailService.sendEmail(
      customer.email, 
      subject || 'We Miss You! Exclusive Win-Back Offer 🎁', 
      content, 
      htmlContent
    );

    const savedMsg = await Message.create({
      customerId,
      content,
      subject: subject || 'We Miss You!',
      channel: 'email',
      status: isSuccess ? 'sent' : 'failed'
    });

    if (isSuccess) {
      customer.lastInactivityMessageSentAt = new Date();
      await customer.save();
      res.status(201).json({ message: 'Email sent successfully!', data: savedMsg });
    } else {
      res.status(500).json({ message: 'Email delivery failed. Check SMTP credentials.', data: savedMsg });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /messages/send-monthly — bulk email to ALL customers with email, once per month
const sendMonthlyMessages = async (req, res) => {
  try {
    // 1. Guard: already sent this calendar month?
    const record = await getMonthlyEmailRecord();
    if (isSameMonth(record?.value)) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);
      return res.status(400).json({
        alreadySent: true,
        message: 'Monthly emails have already been sent this month.',
        nextAvailableDate: nextMonth.toISOString(),
        lastSent: record.value
      });
    }

    // 2. Fetch all customers who have an email address
    const customers = await Customer.find({ email: { $exists: true, $ne: '' } });

    if (customers.length === 0) {
      return res.status(404).json({ message: 'No customers with email addresses found.' });
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // 3. Send to each customer (controlled, sequential to avoid rate limiting)
    for (const customer of customers) {
      try {
        const personalMsg = `Hello ${customer.name},\n\nCheck out our latest offers and exclusive discounts. We value you as our customer!\n\n${customer.rewardPoints > 0 ? `You currently have ${customer.rewardPoints} loyalty points — redeem them on your next visit! 🎁\n\n` : ''}Visit us soon for amazing deals crafted just for you.\n\n— The ShopCRM Team`;

        const htmlBody = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
            <div style="text-align:center;margin-bottom:28px;">
              <h2 style="color:#14b8a6;font-size:26px;margin:0;">ShopCRM</h2>
              <p style="color:#64748b;font-size:12px;margin:6px 0 0;">Monthly Newsletter</p>
            </div>
            <h3 style="color:#f1f5f9;font-size:20px;margin-bottom:8px;">Hello, <span style="color:#14b8a6;">${customer.name}</span>! 👋</h3>
            <p style="color:#cbd5e1;line-height:1.8;font-size:15px;">
              Check out our <strong style="color:#22d3ee;">latest offers</strong> and <strong style="color:#22d3ee;">exclusive discounts</strong> — crafted just for you!
            </p>
            <p style="color:#cbd5e1;line-height:1.7;font-size:15px;">We value you as our customer and want to make sure you never miss out on the best deals.</p>
            ${customer.rewardPoints > 0 ? `
            <div style="margin:24px 0;padding:18px;background:#1e293b;border-radius:12px;border-left:4px solid #f59e0b;">
              <p style="color:#fbbf24;margin:0;font-size:14px;font-weight:bold;">🏆 Loyalty Points Reminder</p>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">You have <strong style="color:#f59e0b;font-size:18px;">${customer.rewardPoints}</strong> points ready to redeem on your next visit!</p>
            </div>` : ''}
            <div style="margin:24px 0;padding:18px;background:#1e293b;border-radius:12px;border-left:4px solid #14b8a6;">
              <p style="color:#14b8a6;margin:0;font-size:14px;font-weight:bold;">🎁 This Month's Special</p>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">Visit our store this month for exclusive member-only discounts and surprise rewards!</p>
            </div>
            <p style="color:#94a3b8;line-height:1.7;font-size:14px;">Thank you for being a valued part of our community. We look forward to serving you!</p>
            <hr style="border:none;border-top:1px solid #1e293b;margin:28px 0;" />
            <p style="color:#475569;font-size:11px;text-align:center;margin:0;">© ${new Date().getFullYear()} ShopCRM. This is an automated monthly newsletter.</p>
          </div>
        `;

        const isSuccess = await emailService.sendEmail(
          customer.email,
          `${customer.name}, Your Monthly Offers from ShopCRM 🎉`,
          personalMsg,
          htmlBody
        );

        await Message.create({
          customerId: customer._id,
          content: personalMsg,
          subject: 'Monthly Offers from ShopCRM',
          channel: 'email',
          status: isSuccess ? 'sent' : 'failed'
        });

        customer.lastMessageSentAt = new Date();
        await customer.save();

        if (isSuccess) { sentCount++; } else { failedCount++; errors.push(customer.email); }

        // Small delay between emails to avoid Gmail rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        failedCount++;
        errors.push(customer.email);
        console.error(`Failed to process ${customer.email}:`, err.message);
      }
    }

    // 4. Persist the timestamp so this month is locked
    await AppSettings.findOneAndUpdate(
      { key: 'lastMonthlyEmailSent' },
      { key: 'lastMonthlyEmailSent', value: new Date() },
      { upsert: true, new: true }
    );

    // 5. Create admin notification
    const notif = await Notification.create({
      type: 'general',
      title: '📬 Monthly Emails Complete',
      message: `Monthly campaign: ${sentCount} sent, ${failedCount} failed out of ${customers.length} customers.`,
      isGlobal: true
    });

    // Emit socket if io is available
    try {
      const io = global._io;
      if (io) io.emit('notification', notif);
    } catch (_) {}

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);

    res.json({
      success: true,
      processed: customers.length,
      sent: sentCount,
      failed: failedCount,
      nextAvailableDate: nextMonth.toISOString(),
      message: `Monthly emails sent to ${sentCount} customer${sentCount !== 1 ? 's' : ''}${failedCount > 0 ? `. ${failedCount} failed.` : ' successfully!'}`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET message history for a customer
const getCustomerMessages = async (req, res) => {
  try {
    const messages = await Message.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET all messages
const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({})
      .populate('customerId', 'name phone email segment')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, sendMonthlyMessages, getMonthlyStatus, getCustomerMessages, getAllMessages, getBulkInactiveStatus, sendBulkInactiveOffers };
