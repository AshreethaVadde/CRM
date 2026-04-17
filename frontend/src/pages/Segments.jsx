import { useState, useEffect } from 'react';
import { Star, Users, UserPlus, Clock, Eye, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart as RechartPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';

const SEGMENT_CONFIG = {
  VIP:       { label: 'VIP Customers',    desc: 'Spending ≥ ₹5,000',          color: '#f59e0b', icon: <Star size={20} />,      bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  badge: 'badge-vip' },
  Frequent:  { label: 'Frequent Buyers',  desc: '5+ store visits',             color: '#a855f7', icon: <Users size={20} />,     bg: 'bg-purple-500/10', border: 'border-purple-500/30', badge: 'badge-frequent' },
  New:       { label: 'New Customers',    desc: '0–1 visits',                  color: '#0ea5e9', icon: <UserPlus size={20} />,  bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   badge: 'badge-new' },
  Inactive:  { label: 'Inactive',         desc: 'No visits in 60+ days',       color: '#ef4444', icon: <Clock size={20} />,     bg: 'bg-red-500/10',    border: 'border-red-500/30',    badge: 'badge-inactive' },
  Occasional:{ label: 'Occasional',       desc: '2–4 visits',                  color: '#64748b', icon: <Users size={20} />,     bg: 'bg-slate-500/10',  border: 'border-slate-500/30',  badge: 'badge-occasional' },
  Regular:   { label: 'Regular',          desc: 'Normal activity',             color: '#10b981', icon: <Users size={20} />,     bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',badge: 'badge-regular' },
};

const Segments = () => {
  const [segments, setSegments] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState('VIP');

  useEffect(() => {
    api.get('/customers/segments')
      .then(({ data }) => { setSegments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const pieData = Object.entries(segments)
    .filter(([, arr]) => arr.length > 0)
    .map(([key, arr]) => ({ name: key, value: arr.length, color: SEGMENT_CONFIG[key]?.color || '#94a3b8' }));

  const totalCustomers = Object.values(segments).reduce((s, a) => s + a.length, 0);
  const activeList = segments[activeSegment] || [];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Customer <span className="bg-gradient-to-r from-crm-teal to-crm-accent bg-clip-text text-transparent">Segments</span>
        </h1>
        <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Automatically classified based on spending, visits, and activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-4 self-start" style={{ color: 'var(--text-muted)' }}>Distribution</h2>
          {loading ? (
            <div className="h-48 w-full animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
          ) : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RechartPie>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)' }}
                  formatter={(val, name) => [`${val} customers`, name]}
                />
                <Legend iconType="circle" iconSize={8} formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{val}</span>} />
              </RechartPie>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</div>
          )}
        </div>

        {/* Segment Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(SEGMENT_CONFIG).map(([key, cfg]) => {
            const count = segments[key]?.length || 0;
            const pct = totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(0) : 0;
            return (
              <button key={key} onClick={() => setActiveSegment(key)}
                className={`p-4 rounded-xl border text-left transition-all hover:scale-105 ${
                  activeSegment === key ? `${cfg.bg} ${cfg.border}` : 'border-transparent hover:bg-white/5'
                }`}
                style={{ background: activeSegment === key ? '' : 'var(--bg-elevated)', borderColor: activeSegment === key ? '' : 'transparent' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ color: cfg.color }}>{cfg.icon}</div>
                  {loading ? (
                    <div className="h-7 w-16 rounded animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
                  ) : (
                    <span className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                  )}
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{cfg.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cfg.desc}</p>
                {!loading && (
                  <div className="mt-2 w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer List for Active Segment */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}>
          <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className={SEGMENT_CONFIG[activeSegment]?.badge}>{activeSegment}</span>
            Customers ({activeList.length})
          </h2>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0" style={{ background: 'var(--bg-elevated)' }}>
              <tr>
                {['Name', 'Phone', 'Spending', 'Visits', 'Points', 'Last Visit', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-left" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center animate-pulse text-crm-teal font-semibold">Loading segments...</td></tr>
              ) : activeList.length === 0 ? (
                <tr><td colSpan="7" className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No customers in this segment</td></tr>
              ) : activeList.map(c => (
                <tr key={c._id} className="border-t hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{c.phone}</td>
                  <td className="px-4 py-3 font-bold text-emerald-400">₹{c.totalSpending?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{c.visits || 0}</td>
                  <td className="px-4 py-3 text-amber-400 font-bold">{c.rewardPoints || 0}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {c.lastVisitDate ? new Date(c.lastVisitDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/customers/${c._id}`} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-crm-cyan border border-crm-cyan/20 rounded-lg hover:bg-crm-cyan/10 transition-colors">
                      <Eye size={12} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Segments;
