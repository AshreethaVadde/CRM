import { useState, useEffect, useContext } from 'react';
import { Plus, Megaphone, Target, Tag, Calendar, Users, TrendingUp, X, Edit, Trash2 } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const STATUS_COLORS = {
  Active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Draft: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Ended: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

const TYPE_ICONS = {
  Discount: '💰', Festive: '🎉', Loyalty: '⭐', Winback: '🔄', General: '📢'
};

const CreateModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '', type: 'Discount', targetSegment: 'All', discountPercent: 10,
    message: '', startDate: new Date().toISOString().split('T')[0], endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name) { setError('Campaign name is required'); return; }
    setLoading(true);
    try {
      await api.post('/campaigns', form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating campaign');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create Campaign</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20">{error}</div>}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Campaign Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Diwali Festival Offer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Type</label>
              <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {['Discount', 'Festive', 'Loyalty', 'Winback', 'General'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Target Segment</label>
              <select className="input-field" value={form.targetSegment} onChange={e => setForm({ ...form, targetSegment: e.target.value })}>
                {['All', 'VIP', 'Frequent', 'Inactive', 'New', 'Occasional'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Discount %</label>
              <input type="number" className="input-field" min="0" max="100" value={form.discountPercent}
                onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>End Date</label>
              <input type="date" className="input-field" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Campaign Message</label>
            <textarea className="input-field resize-none h-20" value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Offer details, terms, etc." />
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-gradient-to-r from-crm-teal to-crm-cyan text-crm-darker font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { canManage } = useContext(AuthContext);

  const fetchCampaigns = async () => {
    setLoading(true);
    try { const { data } = await api.get('/campaigns'); setCampaigns(data); }
    catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try { await api.delete(`/campaigns/${id}`); fetchCampaigns(); } catch (e) {}
  };

  const handleStatusChange = async (id, status) => {
    try { await api.put(`/campaigns/${id}`, { status }); fetchCampaigns(); } catch (e) {}
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Campaign <span className="bg-gradient-to-r from-crm-accent to-crm-cyan bg-clip-text text-transparent">Manager</span>
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Create and manage discount campaigns for customer segments</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-crm-accent to-crm-cyan text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg">
            <Plus size={18} /> New Campaign
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', count: campaigns.length, color: 'text-crm-cyan', bg: 'bg-crm-cyan/10' },
          { label: 'Active', count: campaigns.filter(c => c.status === 'Active').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Draft', count: campaigns.filter(c => c.status === 'Draft').length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Ended', count: campaigns.filter(c => c.status === 'Ended').length, color: 'text-slate-400', bg: 'bg-slate-500/10' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-xl border flex items-center gap-3 ${s.bg} border-current/20`}
            style={{ borderColor: 'var(--border-color)' }}>
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.count}</div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{s.label} Campaigns</div>
          </div>
        ))}
      </div>

      {/* Campaign Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass-card p-6 h-44 animate-pulse" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Megaphone size={48} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No campaigns yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Create your first campaign to target customer segments</p>
          {canManage && (
            <button onClick={() => setShowModal(true)} className="btn-primary w-auto px-8">Create Campaign</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(camp => (
            <div key={camp._id} className="glass-card p-5 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-crm-teal to-crm-accent" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{TYPE_ICONS[camp.type] || '📢'}</span>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{camp.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[camp.status]}`}>{camp.status}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{camp.type}</span>
                    </div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1.5 shrink-0">
                    {camp.status !== 'Ended' && (
                      <button onClick={() => handleStatusChange(camp._id, camp.status === 'Active' ? 'Ended' : 'Active')}
                        className="px-3 py-1 text-xs font-bold rounded-lg border hover:bg-white/5 transition-colors"
                        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                        {camp.status === 'Active' ? 'End' : 'Activate'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(camp._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {camp.message && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{camp.message}</p>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Discount</p>
                  <p className="font-extrabold text-crm-teal">{camp.discountPercent}%</p>
                </div>
                <div className="p-2.5 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Target</p>
                  <p className="font-extrabold text-xs" style={{ color: 'var(--text-primary)' }}>{camp.targetSegment}</p>
                </div>
                <div className="p-2.5 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Targeted</p>
                  <p className="font-extrabold" style={{ color: 'var(--text-primary)' }}>{camp.totalTargeted}</p>
                </div>
              </div>

              {camp.endDate && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={12} />
                  Ends: {new Date(camp.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && <CreateModal onClose={() => setShowModal(false)} onCreated={fetchCampaigns} />}
    </div>
  );
};

export default Campaigns;
