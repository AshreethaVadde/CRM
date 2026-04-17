const Store = require('../models/Store');
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');

const getStores = async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true })
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });

    // Attach basic stats
    const storesWithStats = await Promise.all(stores.map(async (store) => {
      const customerCount = await Customer.countDocuments({ storeId: store._id });
      const bills = await Bill.find({ storeId: store._id });
      const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
      return { ...store.toObject(), customerCount, totalRevenue };
    }));

    res.json(storesWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('managerId', 'name email');
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStore = async (req, res) => {
  try {
    const { name, location, managerId } = req.body;
    if (!name) return res.status(400).json({ message: 'Store name is required' });
    const store = await Store.create({ name, location, managerId: managerId || null });
    res.status(201).json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });
    Object.assign(store, req.body);
    await store.save();
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });
    store.isActive = false;
    await store.save();
    res.json({ message: 'Store deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStores, getStoreById, createStore, updateStore, deleteStore };
