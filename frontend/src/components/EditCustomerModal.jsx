import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

const EditCustomerModal = ({ isOpen, onClose, onCustomerUpdated, initialData }) => {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', tags: 'Normal', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        tags: initialData.tags || 'Normal',
        notes: initialData.notes || ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError('Name and phone are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.put(`/customers/${initialData._id}`, formData);
      onCustomerUpdated(); 
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative animate-[fadeIn_0.2s_ease-out]">
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Customer</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && <div className="text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Name *</label>
              <input type="text" name="name" required className="input-field" value={formData.name} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm mb-1 font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Phone *</label>
              <input type="text" name="phone" required className="input-field" value={formData.phone} onChange={handleChange} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm mb-1 font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Category</label>
              <select name="tags" className="input-field" value={formData.tags} onChange={handleChange}>
                <option value="Normal">Normal</option>
                <option value="VIP">VIP</option>
                <option value="Occasional">Occasional</option>
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm mb-1 font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Address</label>
             <input type="text" name="address" className="input-field" value={formData.address} onChange={handleChange} />
          </div>

          <div>
             <label className="block text-sm mb-1 font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Notes</label>
             <textarea name="notes" className="input-field resize-none h-24" value={formData.notes} onChange={handleChange} />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold border hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-crm-teal to-crm-cyan text-crm-dark font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Saving...' : 'Update Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomerModal;
