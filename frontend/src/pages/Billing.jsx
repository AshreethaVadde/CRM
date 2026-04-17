import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Receipt, CheckCircle, Package, IndianRupee, HandCoins, Tag, ChevronDown } from 'lucide-react';
import api from '../services/api';

const Billing = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemCategory, setItemCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [billResult, setBillResult] = useState(null);
  const [usePoints, setUsePoints] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const CATEGORIES = ['General', 'Clothing', 'Electronics', 'Groceries', 'Cosmetics', 'Footwear', 'Accessories', 'Food & Beverage'];

  useEffect(() => {
    fetchCustomers();
    fetchCampaigns();
  }, []);

  const fetchCustomers = async () => {
    try { const { data } = await api.get('/customers'); setCustomers(data); } catch (e) {}
  };

  const fetchCampaigns = async () => {
    try { const { data } = await api.get('/campaigns/active'); setCampaigns(data); } catch (e) {}
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  ).slice(0, 6);

  const handleAddItem = () => {
    if (!itemName || !itemPrice || itemQty < 1) return;
    setItems([...items, { id: Date.now(), name: itemName, price: Number(itemPrice), quantity: Number(itemQty), category: itemCategory }]);
    setItemName(''); setItemPrice(''); setItemQty(1); setItemCategory('General');
  };

  const handleRemoveItem = (id) => setItems(items.filter(i => i.id !== id));

  const subtotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const campaignDiscount = selectedCampaign ? Math.floor((subtotal * selectedCampaign.discountPercent) / 100) : 0;
  const afterCampaign = subtotal - campaignDiscount;
  const maxPointsDiscount = Math.floor(afterCampaign * 0.5);
  const pointsAvailable = selectedCustomer?.rewardPoints || 0;
  const pointsToUse = usePoints ? Math.min(pointsAvailable, maxPointsDiscount) : 0;
  const grandTotal = Math.max(0, afterCampaign - pointsToUse);
  const pointsToEarn = Math.floor(grandTotal / 50);

  const handleGenerateBill = async () => {
    if (!selectedCustomer) return alert('Select a customer first');
    if (items.length === 0) return alert('Add at least one item');
    setLoading(true); setSuccess(false);
    try {
      const { data } = await api.post('/billing', {
        customerId: selectedCustomer._id,
        items,
        usePoints,
        campaignDiscount: selectedCampaign?.discountPercent || 0
      });
      setBillResult(data);
      setSuccess(true);
      setItems([]); setSelectedCustomer(null); setSearchTerm('');
      setUsePoints(false); setSelectedCampaign(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Error generating bill');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container flex gap-6 pb-0" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
      {/* Left Column */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            Point of Sale <span className="bg-gradient-to-r from-crm-accent to-crm-cyan bg-clip-text text-transparent">Terminal</span>
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Process checkout and generate loyalty rewards</p>
        </div>

        {/* Customer Selection */}
        <div className="glass-card p-5 overflow-visible relative z-20">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Search size={14} className="text-crm-accent" /> Select Member
          </h2>
          {!selectedCustomer ? (
            <div className="relative">
              <input
                type="text" placeholder="Search by name or phone..."
                className="input-field text-base font-medium" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && filteredCustomers.length > 0 && (
                <div className="absolute top-14 left-0 w-full rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y animate-fade-in"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderColor: 'var(--border-color)' }}>
                  {filteredCustomers.map(c => (
                    <div key={c._id} className="p-3 hover:bg-white/5 cursor-pointer flex items-center justify-between group"
                      onClick={() => { setSelectedCustomer(c); setSearchTerm(''); setUsePoints(false); }}>
                      <div>
                        <div className="font-bold text-sm group-hover:text-crm-cyan transition-colors" style={{ color: 'var(--text-primary)' }}>{c.name}</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.phone}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                          {c.rewardPoints || 0} pts
                        </span>
                        {c.segment && <span className={`badge-${c.segment?.toLowerCase()}`}>{c.segment}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center p-4 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-hover)' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-crm-cyan/20 text-crm-cyan flex items-center justify-center font-bold text-lg border border-crm-cyan/30">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCustomer.name}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{selectedCustomer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-400">{selectedCustomer.rewardPoints || 0} pts available</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedCustomer.loyaltyTier || 'Bronze'} tier</p>
                </div>
                <button onClick={() => { setSelectedCustomer(null); setUsePoints(false); }}
                  className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors">
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Campaign Selection */}
        {campaigns.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Tag size={14} className="text-crm-teal" /> Apply Campaign Discount
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {campaigns.map(c => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCampaign(selectedCampaign?._id === c._id ? null : c)}
                  className={`text-left p-3 rounded-xl border text-sm transition-all ${
                    selectedCampaign?._id === c._id
                      ? 'border-crm-teal/60 bg-crm-teal/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  style={{ background: selectedCampaign?._id === c._id ? '' : 'var(--bg-elevated)' }}
                >
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                  <p className="text-xs text-crm-teal font-bold mt-0.5">{c.discountPercent}% OFF</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="glass-card p-5 flex flex-col flex-1">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Package size={14} className="text-crm-teal" /> Cart Items
          </h2>
          {/* Add Item Row */}
          <div className="grid grid-cols-12 gap-2 mb-5 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <div className="col-span-4">
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Item Name</label>
              <input type="text" className="input-field" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. T-Shirt" onKeyDown={e => e.key === 'Enter' && handleAddItem()} />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Category</label>
              <select className="input-field" value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Price (₹)</label>
              <input type="number" className="input-field" value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="0" />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Qty</label>
              <input type="number" className="input-field" value={itemQty} onChange={e => setItemQty(e.target.value)} min="1" />
            </div>
            <div className="col-span-2 flex items-end">
              <button onClick={handleAddItem} className="btn-primary flex items-center justify-center gap-1 h-[42px]">
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                  <th className="py-3 px-4 text-left font-bold text-xs uppercase">Item</th>
                  <th className="py-3 px-4 text-left font-bold text-xs uppercase">Category</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase">Qty</th>
                  <th className="py-3 px-4 text-right font-bold text-xs uppercase">Amount</th>
                  <th className="py-3 px-2" />
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="5" className="py-10 text-center" style={{ color: 'var(--text-muted)' }}>Cart is empty — add items above</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} className="border-t hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{item.category}</td>
                    <td className="py-3 px-4 text-center font-bold" style={{ color: 'var(--text-primary)' }}>{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-bold text-crm-cyan">₹{(item.price * item.quantity).toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column — Order Summary */}
      <div className="w-[320px] shrink-0">
        <div className="glass-card p-0 overflow-hidden sticky top-4 rounded-2xl flex flex-col">
          <div className="h-1.5 bg-gradient-to-r from-crm-teal via-crm-cyan to-crm-accent" />
          <div className="p-5 flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Receipt size={14} /> Order Summary
            </h2>

            {/* Line items */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>₹{subtotal.toLocaleString()}</span>
              </div>
              {campaignDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-crm-teal">Campaign Discount ({selectedCampaign.discountPercent}%)</span>
                  <span className="font-bold text-crm-teal">–₹{campaignDiscount.toLocaleString()}</span>
                </div>
              )}
              {usePoints && pointsToUse > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-400">Points Redeemed ({pointsToUse} pts)</span>
                  <span className="font-bold text-amber-400">–₹{pointsToUse.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Grand Total</span>
                <span className="text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-crm-cyan">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Apply Points Toggle */}
            {selectedCustomer && pointsAvailable > 0 && (
              <button
                onClick={() => setUsePoints(!usePoints)}
                className={`w-full p-3 rounded-xl border text-sm font-bold flex items-center justify-between transition-all ${
                  usePoints
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-white/10 hover:border-amber-500/30'
                }`}
                style={{ color: usePoints ? '' : 'var(--text-secondary)' }}
              >
                <span className="flex items-center gap-2">
                  <HandCoins size={16} className={usePoints ? 'text-amber-400' : ''} />
                  Apply {pointsAvailable} Reward Points
                </span>
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${usePoints ? 'bg-amber-400 border-amber-400' : 'border-current'}`}>
                  {usePoints && <span className="w-2 h-2 bg-white rounded-full" />}
                </span>
              </button>
            )}

            {/* Points Earn Preview */}
            {grandTotal > 0 && selectedCustomer && (
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs">
                <p className="text-amber-400/80 font-bold uppercase tracking-wider mb-0.5">Loyalty Reward</p>
                <p className="text-amber-300">+<span className="font-extrabold text-white">{pointsToEarn}</span> points (1 pt per ₹50)</p>
              </div>
            )}

            <button
              onClick={handleGenerateBill}
              disabled={loading || !selectedCustomer || items.length === 0}
              className="btn-primary py-4 text-base shadow-[0_0_30px_-5px_rgba(20,184,166,0.4)]"
            >
              {loading ? 'Processing...' : 'Complete Checkout'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      {success && billResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
          <div className="glass p-8 rounded-3xl max-w-sm w-full text-center flex flex-col items-center relative overflow-hidden mx-4">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-green-500/20">
              <CheckCircle size={44} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>Transaction Complete!</h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Receipt for <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{billResult.customer?.name}</span>
            </p>
            <div className="w-full p-4 rounded-2xl mb-6 text-left border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
              {[
                { label: 'Amount Paid', value: `₹${billResult.billTotal?.toLocaleString()}` },
                billResult.pointsUsed > 0 && { label: 'Points Used', value: `-${billResult.pointsUsed} pts` },
                { label: 'Points Earned', value: `+${billResult.pointsEarned} pts`, highlight: true },
              ].filter(Boolean).map((row, i) => (
                <div key={i} className="flex justify-between mb-2 last:mb-0 text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span className={`font-extrabold ${row.highlight ? 'text-amber-400' : ''}`} style={{ color: row.highlight ? '' : 'var(--text-primary)' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSuccess(false)} className="btn-primary">New Transaction</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
