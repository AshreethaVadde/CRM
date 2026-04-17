const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

// Routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const billingRoutes = require('./routes/billingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const storeRoutes = require('./routes/storeRoutes');
const userAdminRoutes = require('./routes/userAdminRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible in controllers via req.app.get('io') and global._io
app.set('io', io);
global._io = io;

app.use(express.json());

const ALLOWED_ORIGINS = [
  'https://crm-xz3b.onrender.com',
  'https://crm-livid-three-94.vercel.app',  // ← your Vercel frontend
  'http://localhost:5173',
  'http://localhost:5174',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app subdomain
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn('❌ CORS blocked origin:', origin);
    callback(new Error('CORS: origin not allowed — ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas connected successfully.'))
  .catch((err) => console.error('❌ MongoDB Atlas connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/admin/users', userAdminRoutes);

// Root route — health check
app.get('/', (req, res) => {
  res.json({
    message: '✅ CRM API is live on Render',
    status: 'running',
    docs: '/api/auth/login (POST), /api/customers (GET), etc.',
  });
});
// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Monthly message cron job — runs on 1st of each month at 9:00 AM
cron.schedule('0 9 1 * *', async () => {
  console.log('📬 Running monthly messaging cron job...');
  try {
    const Message = require('./models/Message');
    const Customer = require('./models/Customer');
    const Notification = require('./models/Notification');

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const customers = await Customer.find({
      $or: [
        { lastMessageSentAt: null },
        { lastMessageSentAt: { $lt: oneMonthAgo } }
      ]
    });

    let count = 0;
    for (const customer of customers) {
      await Message.create({
        customerId: customer._id,
        content: `Dear ${customer.name}, thank you for being with ShopCRM! Visit us this month for exclusive offers and loyalty rewards.`,
        subject: 'Monthly Update from ShopCRM',
        channel: 'app'
      });
      customer.lastMessageSentAt = new Date();
      await customer.save();
      count++;
    }

    const notif = await Notification.create({
      type: 'general',
      title: '📬 Monthly Messages Sent',
      message: `Monthly messages automatically sent to ${count} customer(s).`,
      isGlobal: true
    });
    io.emit('notification', notif);
    console.log(`✅ Monthly messages sent to ${count} customers.`);
  } catch (err) {
    console.error('❌ Monthly cron error:', err.message);
  }
});

// Real-Time Inactivity Processor (Runs every minute for demo purposes)
// Disabled temporarily so user can manually demonstrate the Bulk Retention feature
// cron.schedule('* * * * *', async () => {
  /*
  try {
    const Customer = require('./models/Customer');
    const Message = require('./models/Message');
    const Notification = require('./models/Notification');
    const emailSvc = require('./services/emailService');

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const inactiveCustomers = await Customer.find({
      lastVisitDate: { $lte: threeDaysAgo },
      $expr: {
        $or: [
          { $eq: ["$lastInactivityMessageSentAt", null] },
          { $lt: ["$lastInactivityMessageSentAt", "$lastVisitDate"] }
        ]
      }
    });

    if (inactiveCustomers.length > 0) {
      console.log(`🔍 Found ${inactiveCustomers.length} new inactive customers. Triggering auto win-back emails...`);
      for (const customer of inactiveCustomers) {
        const body = `Hi ${customer.name}, we miss you! Visit our store for exciting offers 🎉`;
        let emailSuccess = false;

        if (customer.email) {
          const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px;"><h2 style="color:#14b8a6;">We Miss You! 🎁</h2><p>${body}</p><p style="margin-top:20px;font-size:12px;color:#64748b;">— ShopCRM Team</p></div>`;
          emailSuccess = await emailSvc.sendEmail(customer.email, 'We Miss You! Come Back for Exclusive Offers 🎁', body, html);
          await Message.create({
            customerId: customer._id,
            content: body,
            subject: 'We Miss You!',
            channel: 'email',
            status: emailSuccess ? 'sent' : 'failed'
          });
        }

        customer.lastInactivityMessageSentAt = new Date();
        await customer.save();

        const notif = await Notification.create({
          type: 'general',
          title: '⚠️ Customer Inactive',
          message: emailSuccess
            ? `${customer.name} hasn't visited in 3 days. Win-back email sent successfully!`
            : `${customer.name} hasn't visited in 3 days. No email on record or delivery failed.`,
          customerId: customer._id,
          storeId: customer.storeId || null
        });

        io.emit('notification', notif);
      }
    }
  } catch (err) {
    console.error('❌ Inactivity cron error:', err.message);
  }
  */
// });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
