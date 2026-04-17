import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Edit, UserX, X, Users, Store, RefreshCw } from 'lucide-react';
import api from '../services/api';

const ROLE_CONFIG = {
  Admin: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Manager: { color: 'text-crm-cyan', bg: 'bg-crm-cyan/10', border: 'border-crm-cyan/30' },
  Staff: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
};

const UserModal = ({ user, stores, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    password: '', role: user?.role || 'Staff',
    storeId: user?.storeId?._id || user?.storeId || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Name and email are required'); return; }
    if (!user && !form.password) { setError('Password is required for new users'); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.storeId) payload.storeId = null;
      if (user?._id) {
        await api.put(`/admin/users/${user._id}`, payload);
      } else {
        await api.post('/admin/users', payload);
      }
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Error saving user'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{user ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Name *</label>
              <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Role</label>
              <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Email *</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!!user} />
          </div>
          {!user && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Password *</label>
              <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Assign Store</label>
            <select className="input-field" value={form.storeId} onChange={e => setForm({ ...form, storeId: e.target.value })}>
              <option value="">No Store (Admin Access)</option>
              {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gradient-to-r from-crm-teal to-crm-cyan text-crm-darker font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50">
              {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalUser, setModalUser] = useState(undefined); // undefined=closed, null=new, obj=edit

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, storesRes] = await Promise.all([api.get('/admin/users'), api.get('/stores').catch(() => ({ data: [] }))]);
      setUsers(usersRes.data);
      setStores(storesRes.data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    try { await api.delete(`/admin/users/${id}`); fetchData(); } catch (e) {}
  };

  const roleCount = (role) => users.filter(u => u.role === role).length;

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            User <span className="bg-gradient-to-r from-crm-cyan to-crm-accent bg-clip-text text-transparent">Management</span>
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Manage accounts, assign roles and store access</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setModalUser(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-crm-teal to-crm-cyan text-crm-darker font-bold rounded-xl hover:opacity-90 active:scale-95 shadow-lg transition-all">
            <Plus size={18} /> Add User
          </button>
        </div>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {['Admin', 'Manager', 'Staff'].map(role => {
          const cfg = ROLE_CONFIG[role];
          return (
            <div key={role} className={`p-5 rounded-xl border ${cfg.bg} ${cfg.border} flex items-center gap-4`}>
              <div className={`p-2.5 rounded-xl ${cfg.bg}`}>
                <ShieldCheck size={20} className={cfg.color} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{role}s</p>
                <p className={`text-2xl font-extrabold ${cfg.color}`}>{loading ? '...' : roleCount(role)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}>
                {['User', 'Email', 'Role', 'Store', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-xs font-bold uppercase text-left" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="py-12 text-center animate-pulse text-crm-teal font-semibold">Loading users...</td></tr>
              ) : users.map(user => {
                const rCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.Staff;
                return (
                  <tr key={user._id} className="border-t hover:bg-white/[0.03] transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${rCfg.bg} ${rCfg.color}`}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${rCfg.bg} ${rCfg.color} ${rCfg.border}`}>{user.role}</span>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {user.storeId?.name || <span style={{ color: 'var(--text-muted)' }}>All Stores</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.isActive !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModalUser(user)} className="p-1.5 rounded-lg border hover:bg-white/5 transition-colors"
                          style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeactivate(user._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                          <UserX size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalUser !== undefined && (
        <UserModal user={modalUser} stores={stores} onClose={() => setModalUser(undefined)} onSaved={fetchData} />
      )}
    </div>
  );
};

export default UsersAdmin;
