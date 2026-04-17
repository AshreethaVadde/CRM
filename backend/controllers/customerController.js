const Customer = require('../models/Customer');
const Bill = require('../models/Bill');

const getCustomers = async (req, res) => {
  try {
    const filter = req.storeFilter || {};
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 360° profile: customer + purchase history from Bill
const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const bills = await Bill.find({ customerId: req.params.id }).sort({ createdAt: -1 }).limit(50);

    // Calculate category frequency
    const catFreq = {};
    bills.forEach(b => {
      (b.items || []).forEach(item => {
        const cat = item.category || 'General';
        catFreq[cat] = (catFreq[cat] || 0) + (item.price * item.quantity);
      });
    });
    const sortedCats = Object.entries(catFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    // Spending trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlySpending = {};
    bills
      .filter(b => new Date(b.createdAt) >= sixMonthsAgo)
      .forEach(b => {
        const key = new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        monthlySpending[key] = (monthlySpending[key] || 0) + b.total;
      });

    // Visit frequency
    const daysSinceFirstVisit = customer.createdAt
      ? Math.max(1, (Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 1;
    const visitsPerMonth = ((customer.visits / daysSinceFirstVisit) * 30).toFixed(1);

    res.json({
      customer,
      bills,
      preferredCategories: sortedCats,
      monthlySpending,
      visitsPerMonth,
      daysSinceLastVisit: Math.floor((Date.now() - new Date(customer.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCustomer = async (req, res) => {
  const { name, phone, email, address, tags, notes, storeId } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }

  try {
    const customer = await Customer.create({
      name, phone, email, address, tags, notes,
      storeId: storeId || req.user?.storeId || null,
      totalSpending: 0,
      visits: 0,
      rewardPoints: 0,
      segment: 'New',
      loyaltyTier: 'Bronze'
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (customer) {
      Object.assign(customer, req.body);
      const updatedCustomer = await customer.save();
      res.json(updatedCustomer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (customer) {
      await customer.deleteOne();
      res.json({ message: 'Customer removed' });
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Segmentation: return all customers grouped by segment
const getSegments = async (req, res) => {
  try {
    const filter = req.storeFilter || {};
    const customers = await Customer.find(filter);

    // Recompute segments in memory for accuracy
    const segmented = {
      VIP: [],
      Frequent: [],
      Inactive: [],
      New: [],
      Occasional: [],
      Regular: []
    };

    for (const c of customers) {
      c.computeSegment();
      if (segmented[c.segment]) {
        segmented[c.segment].push(c);
      } else {
        segmented['Regular'].push(c);
      }
    }

    res.json(segmented);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Inactive customers (no visit in 3+ days)
const getInactiveCustomers = async (req, res) => {
  try {
    const filter = req.storeFilter || {};
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const customers = await Customer.find({
      ...filter,
      lastVisitDate: { $lt: cutoff }
    }).sort({ lastVisitDate: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  getCustomerProfile,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getSegments,
  getInactiveCustomers
};
