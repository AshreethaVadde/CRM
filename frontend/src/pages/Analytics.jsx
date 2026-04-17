import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, IndianRupee, ShoppingBag, Calendar, Filter, RefreshCw, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeChart, setActiveChart] = useState('revenue');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [dailyRes, chartRes] = await Promise.all([
        api.get(`/analytics/daily?startDate=${startDate}&endDate=${endDate}`),
        api.get('/analytics/chart')
      ]);
      setData(dailyRes.data);
      setChartData(chartRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const stats = data ? [
    { label: 'Total Revenue', value: `₹${data.summary.totalRevenue?.toLocaleString()}`, icon: <IndianRupee size={22} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Visits', value: data.summary.totalVisits, icon: <TrendingUp size={22} />, color: 'text-crm-cyan', bg: 'bg-crm-cyan/10' },
    { label: 'Avg Bill Value', value: `₹${data.summary.avgBill?.toLocaleString()}`, icon: <ShoppingBag size={22} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Top Products', value: data.topProducts?.length || 0, icon: <Package size={22} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ] : [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Sales <span className="bg-gradient-to-r from-crm-teal to-crm-cyan bg-clip-text text-transparent">Analytics</span>
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Daily revenue, visits, and purchase intelligence</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Date Range</span>
        </div>
        <input type="date" className="input-field w-auto" value={startDate} onChange={e => setStartDate(e.target.value)}
          style={{ maxWidth: '160px' }} />
        <span style={{ color: 'var(--text-muted)' }}>to</span>
        <input type="date" className="input-field w-auto" value={endDate} onChange={e => setEndDate(e.target.value)}
          style={{ maxWidth: '160px' }} />
        <button onClick={fetchAnalytics}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-crm-teal to-crm-cyan text-crm-darker text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg">
          <RefreshCw size={15} /> Apply
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse" style={{ height: '100px' }} />
          ))
        ) : stats.map((s, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.bg} ${s.color} shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="w-2 h-5 rounded-full bg-crm-cyan" />
            30-Day Trend
          </h2>
          <div className="flex gap-2">
            {['revenue', 'visits'].map(type => (
              <button key={type} onClick={() => setActiveChart(type)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all capitalize ${activeChart === type ? 'border-crm-teal/50 bg-crm-teal/10 text-crm-teal' : 'border-white/10 hover:border-white/20'}`}
                style={{ color: activeChart === type ? '' : 'var(--text-secondary)' }}>
                {type === 'revenue' ? '₹ Revenue' : '# Visits'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[240px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={v => activeChart === 'revenue' ? `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}` : v} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey={activeChart} stroke={activeChart === 'revenue' ? '#14b8a6' : '#0ea5e9'}
                  strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>No billing data in this range</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            Daily Breakdown
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0" style={{ background: 'var(--bg-elevated)' }}>
                <tr>
                  {['Date', 'Revenue', 'Visits', 'Avg Bill'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-left" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="py-8 text-center animate-pulse text-crm-teal font-semibold">Loading...</td></tr>
                ) : !data?.dailyData?.length ? (
                  <tr><td colSpan="4" className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No data for this range</td></tr>
                ) : data.dailyData.map((day, i) => (
                  <tr key={i} className="border-t hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{day.date}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">₹{day.revenue?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{day.visits}</td>
                    <td className="px-4 py-3 text-crm-cyan font-bold">₹{day.visits > 0 ? Math.round(day.revenue / day.visits).toLocaleString() : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            Top Products
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0" style={{ background: 'var(--bg-elevated)' }}>
                <tr>
                  {['Product', 'Category', 'Qty Sold', 'Revenue'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-left" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="py-8 text-center animate-pulse text-crm-teal font-semibold">Loading...</td></tr>
                ) : !data?.topProducts?.length ? (
                  <tr><td colSpan="4" className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No product data yet</td></tr>
                ) : data.topProducts.map((p, i) => (
                  <tr key={i} className="border-t hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-crm-teal/20 text-crm-teal flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                        {p.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{p.category}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{p.totalSold}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">₹{p.totalRevenue?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
