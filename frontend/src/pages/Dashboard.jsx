import { useState, useEffect, useContext } from 'react';
import { Users, IndianRupee, TrendingUp, Award, Activity, AlertTriangle, Star, UserCheck, UserX, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const SegmentBadge = ({ segment }) => {
  const map = {
    VIP: 'badge-vip', Frequent: 'badge-frequent', Inactive: 'badge-inactive',
    New: 'badge-new', Occasional: 'badge-occasional', Regular: 'badge-regular'
  };
  return <span className={map[segment] || 'badge-regular'}>{segment}</span>;
};

const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [custRes, chartRes, inactiveRes] = await Promise.all([
        api.get('/customers'),
        api.get('/analytics/chart').catch(() => ({ data: [] })),
        api.get('/customers/inactive').catch(() => ({ data: [] }))
      ]);
      setCustomers(custRes.data);
      setChartData(chartRes.data);
      setInactiveCustomers(inactiveRes.data);
    } catch (error) {
      console.error('Dashboard fetch error', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((acc, c) => acc + (c.totalSpending || 0), 0);
  const totalVisits = customers.reduce((acc, c) => acc + (c.visits || 0), 0);
  const totalPoints = customers.reduce((acc, c) => acc + (c.rewardPoints || 0), 0);

  const vipCount = customers.filter(c => c.segment === 'VIP' || c.totalSpending >= 5000).length;
  const frequentCount = customers.filter(c => c.segment === 'Frequent' || c.visits >= 5).length;
  const newCount = customers.filter(c => c.segment === 'New' || c.visits <= 1).length;
  
  // Dashboard alert only shows uncontacted inactive customers
  const inactiveCount = inactiveCustomers.filter(c => 
    !c.lastInactivityMessageSentAt || new Date(c.lastInactivityMessageSentAt) <= new Date(c.lastVisitDate)
  ).length;

  const stats = [
    { label: 'Total Customers', value: totalCustomers, icon: <Users size={26} />, color: 'from-blue-500 to-crm-cyan', text: 'text-crm-cyan' },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: <IndianRupee size={26} />, color: 'from-emerald-400 to-crm-teal', text: 'text-emerald-400' },
    { label: 'Total Visits', value: totalVisits, icon: <TrendingUp size={26} />, color: 'from-purple-500 to-crm-accent', text: 'text-purple-400' },
    { label: 'Reward Points', value: totalPoints.toLocaleString(), icon: <Award size={26} />, color: 'from-amber-400 to-orange-500', text: 'text-amber-400' },
  ];

  const topCustomers = [...customers]
    .sort((a, b) => b.totalSpending - a.totalSpending)
    .slice(0, 5)
    .map(c => ({ name: c.name.split(' ')[0], spending: c.totalSpending, segment: c.segment }));

  const ttColor = '#var(--text-primary)';

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <Activity className="animate-spin text-crm-cyan mb-4" size={48} />
      <p className="animate-pulse font-semibold" style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Dashboard <span className="bg-gradient-to-r from-crm-teal to-crm-cyan bg-clip-text text-transparent">Overview</span>
          </h1>
          <p className="mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Real-time metrics and insights</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-crm-cyan/10 border border-crm-cyan/30">
            <Bell size={16} className="text-crm-cyan" />
            <span className="text-sm font-bold text-crm-cyan">{unreadCount} new notifications</span>
          </div>
        )}
      </div>

      {/* Inactive Alert Banner */}
      {inactiveCount > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center justify-between flex-wrap gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-red-300">{inactiveCount} Inactive Customer{inactiveCount > 1 ? 's' : ''} Detected</p>
              <p className="text-xs text-red-400/80">No visits in 3+ days. Consider sending a win-back offer.</p>
            </div>
          </div>
          <Link to="/retention" className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-bold rounded-lg border border-red-500/30 transition-colors">
            View Retention →
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300 rounded-full`} />
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.text} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
                style={{ background: 'var(--bg-elevated)' }}>
                {stat.icon}
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>{stat.value}</h3>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Segment Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'VIP Customers', count: vipCount, icon: <Star size={18} />, cls: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Frequent Buyers', count: frequentCount, icon: <UserCheck size={18} />, cls: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'New Customers', count: newCount, icon: <Users size={18} />, cls: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Inactive', count: inactiveCount, icon: <UserX size={18} />, cls: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-xl border ${s.bg} flex items-center gap-3`}>
            <div className={`${s.cls} shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{s.count}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Line Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="w-2 h-5 rounded-full bg-crm-cyan" />
            Revenue (Last 30 Days)
          </h2>
          <div className="h-[240px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No billing data yet</div>
            )}
          </div>
        </div>

        {/* Top Customers Bar Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="w-2 h-5 rounded-full bg-crm-teal" />
            Top Customers by Spending
          </h2>
          <div className="h-[240px]">
            {topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCustomers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)' }} />
                  <Bar dataKey="spending" radius={[6,6,0,0]} fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No customer data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Retention Analysis */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span className="w-2 h-5 rounded-full bg-crm-accent" />
          Customer Segments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'VIP (> ₹5,000)', val: customers.filter(c => c.totalSpending >= 5000).length, col: 'from-amber-400 to-orange-500', txt: 'text-amber-400' },
            { label: 'Regular (₹2k–₹5k)', val: customers.filter(c => c.totalSpending >= 2000 && c.totalSpending < 5000).length, col: 'from-emerald-400 to-crm-teal', txt: 'text-emerald-400' },
            { label: 'Occasional (< ₹2k)', val: customers.filter(c => c.totalSpending < 2000).length, col: 'from-slate-400 to-slate-500', txt: 'text-slate-400' },
          ].map((segment, i) => {
            const perc = ((segment.val / (customers.length || 1)) * 100).toFixed(0);
            return (
              <div key={i} className="group cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{segment.label}</span>
                  <span className={`font-bold text-sm ${segment.txt}`}>{segment.val} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>({perc}%)</span></span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div className={`bg-gradient-to-r ${segment.col} h-full rounded-full transition-all duration-700`} style={{ width: `${perc}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
