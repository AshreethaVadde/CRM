import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Phone, MapPin, Mail, Tag, Calendar, IndianRupee, Trash2, Edit3, ArrowLeft, Loader2, Sparkles, ShoppingBag, TrendingUp, Award, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';
import EditCustomerModal from '../components/EditCustomerModal';

const TierBadge = ({ tier }) => {
  const map = { Bronze: 'badge-bronze', Silver: 'badge-silver', Gold: 'badge-gold', Platinum: 'badge-platinum' };
  return <span className={map[tier] || 'badge-bronze'}>{tier}</span>;
};

const SegmentBadge = ({ segment }) => {
  const map = { VIP: 'badge-vip', Frequent: 'badge-frequent', Inactive: 'badge-inactive', New: 'badge-new', Occasional: 'badge-occasional', Regular: 'badge-regular' };
  return <span className={map[segment] || 'badge-regular'}>{segment}</span>;
};

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesTemp, setNotesTemp] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => { fetchProfile(); }, [id]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/customers/${id}/profile`);
      setProfile(data);
      setNotesTemp(data.customer?.notes || '');
    } catch (error) {
      if (error.response?.status === 404) navigate('/customers');
    } finally { setLoading(false); }
  };

  const handleUpdateNotes = async () => {
    try {
      await api.put(`/customers/${id}`, { notes: notesTemp });
      setProfile(prev => ({ ...prev, customer: { ...prev.customer, notes: notesTemp } }));
      setIsEditingNotes(false);
    } catch (e) {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this customer?')) return;
    try { await api.delete(`/customers/${id}`); navigate('/customers'); } catch (e) {}
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-crm-cyan" size={48} /></div>;
  if (!profile) return <div className="p-8 text-center text-red-400">Customer not found</div>;

  const { customer, bills = [], preferredCategories = [], monthlySpending = {}, visitsPerMonth, daysSinceLastVisit } = profile;

  const spendingChartData = Object.entries(monthlySpending).map(([month, amount]) => ({ month, amount }));

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'purchases', label: `Purchase History (${bills.length})` },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="page-container">
      <Link to="/customers" className="inline-flex items-center gap-2 mb-6 text-sm font-medium group transition-colors"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left: Customer Card */}
        <div className="lg:col-span-1">
          <div className="glass-card p-0 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-24 z-0" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.3), rgba(139,92,246,0.2))' }} />
            <button onClick={handleDelete} title="Delete Customer" className="absolute top-3 right-3 p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/40 z-20 transition-colors">
              <Trash2 size={16} />
            </button>
            <button onClick={() => setIsEditModalOpen(true)} title="Edit Customer Details" className="absolute top-3 right-12 p-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 z-20 transition-colors">
              <Edit3 size={16} />
            </button>
            <div className="relative z-10 pt-12 pb-6 flex flex-col items-center text-center border-b px-4" style={{ borderColor: 'var(--border-color)' }}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-crm-cyan to-crm-teal flex items-center justify-center mb-3 shadow-xl shadow-crm-teal/30 border-4 border-white/10">
                <User size={44} className="text-white" />
              </div>
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>{customer.name}</h2>
              <div className="flex flex-wrap gap-2 justify-center">
                <SegmentBadge segment={customer.segment || 'New'} />
                <TierBadge tier={customer.loyaltyTier || 'Bronze'} />
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3 text-sm">
              {[
                { icon: <Phone size={16} />, val: customer.phone, color: 'text-crm-cyan' },
                { icon: <Mail size={16} />, val: customer.email || 'Not provided', color: 'text-crm-teal' },
                { icon: <MapPin size={16} />, val: customer.address || 'Not provided', color: 'text-indigo-400' },
                { icon: <Calendar size={16} />, val: `Joined ${new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`, color: 'text-rose-400' },
                { icon: <Clock size={16} />, val: `Last visit: ${daysSinceLastVisit}d ago`, color: 'text-amber-400' },
              ].map((row, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                  <div className={row.color}>{row.icon}</div>
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{row.val}</span>
                </div>
              ))}

              {/* Preferred Categories */}
              {preferredCategories.length > 0 && (
                <div className="p-2.5 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                  <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Preferred Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {preferredCategories.map(cat => (
                      <span key={cat} className="px-2 py-0.5 rounded-full text-xs font-medium bg-crm-teal/10 text-crm-teal border border-crm-teal/20">{cat}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Stats Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Spending', val: `₹${customer.totalSpending?.toLocaleString() || 0}`, icon: <IndianRupee size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Store Visits', val: customer.visits || 0, icon: <TrendingUp size={20} />, color: 'text-crm-cyan', bg: 'bg-crm-cyan/10' },
              { label: 'Reward Points', val: (customer.rewardPoints || 0).toLocaleString(), icon: <Award size={20} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map((s, i) => (
              <div key={i} className="glass-card p-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-xl mb-2 ${s.bg} ${s.color}`}>{s.icon}</div>
                <p className="text-xs uppercase tracking-wide mb-1 font-bold" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                <h3 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{s.val}</h3>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === t.id ? 'bg-crm-teal text-white shadow-md' : 'hover:bg-white/5'
                }`}
                style={{ color: activeTab === t.id ? '' : 'var(--text-secondary)' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="glass-card p-6 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-4 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Internal Notes</h3>
                <button onClick={() => setIsEditingNotes(!isEditingNotes)}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium flex items-center gap-1.5 hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>
                  {isEditingNotes ? 'Discard' : <><Edit3 size={13} /> Edit</>}
                </button>
              </div>
              {isEditingNotes ? (
                <div className="flex flex-col gap-3 flex-1">
                  <textarea className="input-field flex-1 resize-none min-h-[180px]" value={notesTemp}
                    onChange={e => setNotesTemp(e.target.value)} placeholder="Record interactions, preferences, sizes..." />
                  <button onClick={handleUpdateNotes} className="btn-primary w-auto self-end px-6">Save Notes</button>
                </div>
              ) : (
                <div className="flex-1 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {customer.notes || <span style={{ color: 'var(--text-muted)' }}>No notes recorded yet. Click Edit to add.</span>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                      <th className="py-3 px-4 text-left font-bold text-xs uppercase">Date</th>
                      <th className="py-3 px-4 text-left font-bold text-xs uppercase">Items</th>
                      <th className="py-3 px-4 font-bold text-xs uppercase">Points Used</th>
                      <th className="py-3 px-4 font-bold text-xs uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.length === 0 ? (
                      <tr><td colSpan="4" className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No purchase history yet</td></tr>
                    ) : bills.map((bill, i) => (
                      <tr key={bill._id || i} className="border-t hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                        <td className="py-3 px-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                          {(bill.items || []).slice(0, 2).map(it => it.name).join(', ')}
                          {bill.items?.length > 2 && ` +${bill.items.length - 2} more`}
                        </td>
                        <td className="py-3 px-4 text-center text-xs">
                          {bill.pointsUsed > 0 ? <span className="text-amber-400 font-bold">{bill.pointsUsed} pts</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-crm-cyan">₹{bill.total?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="glass-card p-6">
              <h3 className="font-bold mb-5" style={{ color: 'var(--text-primary)' }}>Monthly Spending (Last 6 Months)</h3>
              {spendingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={spendingChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)' }} />
                    <Bar dataKey="amount" fill="#14b8a6" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>No billing data available</div>
              )}
            </div>
          )}
        </div>
      </div>
      <EditCustomerModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onCustomerUpdated={fetchProfile} initialData={customer} />
    </div>
  );
};

export default CustomerProfile;
