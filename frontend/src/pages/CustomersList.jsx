import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Filter, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AddCustomerModal from '../components/AddCustomerModal';
import EditCustomerModal from '../components/EditCustomerModal';
import { Edit } from 'lucide-react';

const SEGMENT_OPTIONS = ['All', 'VIP', 'Frequent', 'Inactive', 'New', 'Occasional', 'Regular'];

const SegmentBadge = ({ segment }) => {
  const map = { VIP: 'badge-vip', Frequent: 'badge-frequent', Inactive: 'badge-inactive', New: 'badge-new', Occasional: 'badge-occasional', Regular: 'badge-regular' };
  return segment ? <span className={map[segment] || 'badge-regular'}>{segment}</span> : null;
};

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const matchesSegment = segmentFilter === 'All' || c.segment === segmentFilter;
    return matchesSearch && matchesSegment;
  });

  // Classify activity for display
  const classify = (c) => {
    if (c.visits >= 5) return 'Active';
    if (c.visits <= 2) return 'Occasional';
    return 'Regular';
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Customers <span className="bg-gradient-to-r from-crm-teal to-crm-cyan bg-clip-text text-transparent">Directory</span>
          </h1>
          <p className="mt-1 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>
            {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} · Manage relationships and lifetime values
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-crm-teal to-crm-cyan text-crm-darker font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-crm-cyan/20 active:scale-95 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          Add Customer
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-2 flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border focus-within:border-crm-cyan transition-all"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text" placeholder="Search by name or phone..."
              className="bg-transparent border-none outline-none text-sm font-medium flex-1"
              style={{ color: 'var(--text-primary)' }}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Segment Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--input-bg)', borderColor: 'var(--border-color)' }}
            >
              <Filter size={15} />
              {segmentFilter === 'All' ? 'All Segments' : segmentFilter}
              <ChevronDown size={14} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute top-full mt-1 right-0 w-44 rounded-xl shadow-xl z-30 overflow-hidden animate-slide-down"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                {SEGMENT_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setSegmentFilter(opt); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-white/5 transition-colors ${segmentFilter === opt ? 'text-crm-cyan bg-crm-cyan/10' : ''}`}
                    style={{ color: segmentFilter === opt ? '' : 'var(--text-secondary)' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}>
                <th className="px-5 py-4 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Name</th>
                <th className="px-5 py-4 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Contact</th>
                <th className="px-5 py-4 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Segment</th>
                <th className="px-5 py-4 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Activity</th>
                <th className="px-5 py-4 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total LTV</th>
                <th className="px-5 py-4 text-center font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Visits</th>
                <th className="px-5 py-4 text-center font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Points</th>
                <th className="px-5 py-4 text-right font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="py-12 text-center text-crm-teal font-semibold animate-pulse">Fetching directory...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="8" className="py-12 text-center font-medium" style={{ color: 'var(--text-muted)' }}>No customers found.</td></tr>
              ) : filteredCustomers.map(customer => (
                <tr key={customer._id} className="border-t hover:bg-white/[0.03] transition-colors group" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 text-crm-cyan"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold group-hover:text-crm-teal transition-colors" style={{ color: 'var(--text-primary)' }}>{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{customer.phone}</td>
                  <td className="px-5 py-4"><SegmentBadge segment={customer.segment || 'New'} /></td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${customer.visits >= 5 ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
                      {classify(customer)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-emerald-400">₹{customer.totalSpending?.toLocaleString() || 0}</span>
                  </td>
                  <td className="px-5 py-4 text-center font-bold" style={{ color: 'var(--text-primary)' }}>{customer.visits || 0}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-amber-400">{customer.rewardPoints || 0}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
			                    <button onClick={() => setEditCustomer(customer)}
			                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 border border-amber-400/20 hover:bg-amber-400/10 hover:border-amber-400/40 transition-all">
			                      <Edit size={13} /> Edit
			                    </button>
                      <Link to={`/customers/${customer._id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-crm-cyan border border-crm-cyan/20 hover:bg-crm-cyan/10 hover:border-crm-cyan/40 transition-all">
                        <Eye size={13} /> View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddCustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCustomerAdded={fetchCustomers} />
      <EditCustomerModal isOpen={!!editCustomer} onClose={() => setEditCustomer(null)} onCustomerUpdated={fetchCustomers} initialData={editCustomer} />
    </div>
  );
};

export default CustomersList;
