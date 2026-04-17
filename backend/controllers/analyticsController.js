const Bill = require('../models/Bill');
const Customer = require('../models/Customer');

// Daily analytics: revenue, visits, customer-wise bills for a date range
const getDailyAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const filter = req.storeFilter || {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59))
      };
    } else {
      // Default: last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filter.createdAt = { $gte: thirtyDaysAgo };
    }

    const bills = await Bill.find(filter)
      .populate('customerId', 'name phone segment')
      .sort({ createdAt: -1 });

    // Group by date
    const dailyMap = {};
    bills.forEach(bill => {
      const date = new Date(bill.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      if (!dailyMap[date]) {
        dailyMap[date] = { date, revenue: 0, visits: 0, bills: [] };
      }
      dailyMap[date].revenue += bill.total;
      dailyMap[date].visits += 1;
      dailyMap[date].bills.push({
        billId: bill._id,
        customer: bill.customerId,
        total: bill.total,
        items: bill.items?.length || 0,
        pointsEarned: bill.pointsEarned,
        pointsUsed: bill.pointsUsed,
        createdAt: bill.createdAt
      });
    });

    const dailyData = Object.values(dailyMap).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    // Top products from items
    const productMap = {};
    bills.forEach(bill => {
      (bill.items || []).forEach(item => {
        const key = item.name;
        if (!productMap[key]) productMap[key] = { name: key, category: item.category || 'General', totalSold: 0, totalRevenue: 0 };
        productMap[key].totalSold += item.quantity;
        productMap[key].totalRevenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productMap).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

    // Summary
    const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
    const totalVisits = bills.length;
    const avgBill = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;

    res.json({ dailyData, topProducts, summary: { totalRevenue, totalVisits, avgBill } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Revenue chart data (for recharts)
const getRevenueChart = async (req, res) => {
  try {
    const filter = req.storeFilter || {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filter.createdAt = { $gte: thirtyDaysAgo };

    const bills = await Bill.find(filter).sort({ createdAt: 1 });

    const chartMap = {};
    bills.forEach(bill => {
      const key = new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!chartMap[key]) chartMap[key] = { date: key, revenue: 0, visits: 0 };
      chartMap[key].revenue += bill.total;
      chartMap[key].visits += 1;
    });

    res.json(Object.values(chartMap));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDailyAnalytics, getRevenueChart };
