import { useState, useEffect } from 'react';
import { Store as StoreIcon, Plus, MapPin, Users, IndianRupee, Edit, Trash2, X, CheckCircle } from 'lucide-react';
import api from '../services/api';

const StoreModal = ({ store, onClose, onSaved }) => {
  const [form, setForm] = useState({ name: store?.name || '', location: store?.location || '', managerId: store?.managerId?._id || '' });
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/users').then(({ data }) => setManagers(data.filter(u => u.role === 'Manager'))).catch(() => {});
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name) { setError('Store name is required'); return; }
    setLoading(true);
    try {
      if (store?._id) {
        await api.put(`/stores/${store._id}`, form);
      } else {
        await api.post('/stores', form);
      }
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Error saving store'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{store ? 'Edit Store' : 'Add Store'}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20">{error}</div>}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Store Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Branch - Hyderabad" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Location</label>
            <input className="input-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City, Area" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Assign Manager</label>
            <select className="input-field" value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>
              <option value="">No Manager Assigned</option>
              {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
            </select>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gradient-to-r from-crm-teal to-crm-cyan text-crm-darker font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50">
              {loading ? 'Saving...' : (store ? 'Update Store' : 'Create Store')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalStore, setModalStore] = useState(undefined); // undefined = closed, null = new, obj = edit

  const fetchStores = async () => {
    setLoading(true);
    try { const { data } = await api.get('/stores'); setStores(data); }
    catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchStores(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this store?')) return;
    try { await api.delete(`/stores/${id}`); fetchStores(); } catch (e) {}
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Store <span className="bg-gradient-to-r from-crm-teal to-crm-accent bg-clip-text text-transparent">Management</span>
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Manage multiple branches, track revenue and customers per store</p>
        </div>
        <button onClick={() => setModalStore(null)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-crm-teal to-crm-cyan text-crm-darker font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg">
          <Plus size={18} /> Add Store
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Stores', val: stores.length, color: 'text-crm-cyan', bg: 'bg-crm-cyan/10' },
          { label: 'Total Customers', val: stores.reduce((s, st) => s + (st.customerCount || 0), 0), color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Total Revenue', val: `₹${stores.reduce((s, st) => s + (st.totalRevenue || 0), 0).toLocaleString()}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((s, i) => (
          <div key={i} className={`p-5 rounded-xl border ${s.bg} flex items-center gap-4`} style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className={`text-2xl font-extrabold mt-0.5 ${s.color}`}>{loading ? '...' : s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Store Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card p-6 h-44 animate-pulse" />)}
        </div>
      ) : stores.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <StoreIcon size={48} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No stores yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Add your first store branch to start tracking multi-store data</p>
          <button onClick={() => setModalStore(null)} className="btn-primary w-auto px-8">Add First Store</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map(store => (
            <div key={store._id} className="glass-card p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-crm-teal to-crm-cyan" />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-crm-teal/20 flex items-center justify-center shrink-0">
                    <StoreIcon size={22} className="text-crm-teal" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{store.name}</h3>
                    {store.location && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{store.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setModalStore(store)} className="p-1.5 rounded-lg border hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(store._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors border border-transparent">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee size={14} className="text-emerald-400" />
                    <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Revenue</p>
                  </div>
                  <p className="text-lg font-extrabold text-emerald-400">₹{(store.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} className="text-crm-cyan" />
                    <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Customers</p>
                  </div>
                  <p className="text-lg font-extrabold text-crm-cyan">{store.customerCount || 0}</p>
                </div>
              </div>

              {store.managerId && (
                <div className="mt-3 p-2.5 rounded-xl flex items-center gap-2 text-xs" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="w-6 h-6 rounded-full bg-crm-accent/20 text-crm-accent flex items-center justify-center font-bold text-[10px]">
                    {store.managerId.name?.charAt(0)}
                  </div>
                  <span style={{ color: 'var(--text-secondary)' }}>Manager: <strong style={{ color: 'var(--text-primary)' }}>{store.managerId.name}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalStore !== undefined && (
        <StoreModal store={modalStore} onClose={() => setModalStore(undefined)} onSaved={fetchStores} />
      )}
    </div>
  );
};

export default Stores;
