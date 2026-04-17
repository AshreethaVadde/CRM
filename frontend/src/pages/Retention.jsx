import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Clock, SendHorizonal, Eye, RefreshCw,
  CheckCircle, X, CalendarClock, Users, Loader2, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

/* ─── Main Retention Page ──────────────────────────────────────── */
const Retention = () => {
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentIds, setSentIds] = useState(new Set());

  // Monthly email state
  const [monthlySending, setMonthlySending] = useState(false);
  const [monthlyResult, setMonthlyResult] = useState(null);
  const [monthlyStatus, setMonthlyStatus] = useState({
    alreadySentThisMonth: false,
    lastSent: null,
    nextAvailableDate: null,
    statusLoading: true
  });

  // Bulk Inactive state
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkStatus, setBulkStatus] = useState({
    onCooldown: false,
    lastSent: null,
    nextAvailableDate: null,
    statusLoading: true
  });

  const fetchInactive = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers/inactive');
      setInactiveCustomers(data);
      // Persist "Offer Sent" state across refreshes:
      const alreadySentSet = new Set(
        data
          .filter(c => c.lastInactivityMessageSentAt && new Date(c.lastInactivityMessageSentAt) > new Date(c.lastVisitDate))
          .map(c => c._id)
      );
      setSentIds(alreadySentSet);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/monthly-status');
      setMonthlyStatus({
        alreadySentThisMonth: data.alreadySentThisMonth,
        lastSent: data.lastSent,
        nextAvailableDate: data.nextAvailableDate,
        statusLoading: false
      });
    } catch {
      setMonthlyStatus(prev => ({ ...prev, statusLoading: false }));
    }
  }, []);

  const fetchBulkStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/inactive-bulk-status');
      setBulkStatus({
        onCooldown: data.onCooldown,
        lastSent: data.lastSent,
        nextAvailableDate: data.nextAvailableDate,
        statusLoading: false
      });
    } catch {
      setBulkStatus(prev => ({ ...prev, statusLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchInactive();
    fetchMonthlyStatus();
    fetchBulkStatus();
  }, [fetchMonthlyStatus, fetchBulkStatus]);

  const daysSince = (date) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSendMonthly = async () => {
    setMonthlySending(true);
    setMonthlyResult(null);
    try {
      const { data } = await api.post('/messages/send-monthly');
      setMonthlyResult({ success: true, ...data });
      setMonthlyStatus({
        alreadySentThisMonth: true,
        lastSent: new Date().toISOString(),
        nextAvailableDate: data.nextAvailableDate,
        statusLoading: false
      });
    } catch (e) {
      const errData = e.response?.data;
      if (errData?.alreadySent) {
        setMonthlyStatus({
          alreadySentThisMonth: true,
          lastSent: errData.lastSent,
          nextAvailableDate: errData.nextAvailableDate,
          statusLoading: false
        });
        setMonthlyResult({ success: false, alreadySent: true, message: errData.message, nextAvailableDate: errData.nextAvailableDate });
      } else {
        setMonthlyResult({ success: false, message: errData?.message || 'Failed to send monthly emails.' });
      }
    } finally {
      setMonthlySending(false);
    }
  };

  const handleSendBulkInactive = async () => {
    setBulkSending(true);
    setBulkResult(null);
    try {
      const { data } = await api.post('/messages/send-inactive-bulk');
      setBulkResult({ success: true, ...data });
      setBulkStatus({
        onCooldown: true,
        lastSent: new Date().toISOString(),
        nextAvailableDate: data.nextAvailableDate,
        statusLoading: false
      });
      // Mark all currently uncontacted as sent in UI
      const newSent = new Set(sentIds);
      inactiveCustomers.forEach(c => {
        if (!newSent.has(c._id)) newSent.add(c._id);
      });
      setSentIds(newSent);
    } catch (e) {
      const errData = e.response?.data;
      if (errData?.onCooldown) {
        setBulkStatus({
          onCooldown: true,
          lastSent: errData.lastSent,
          nextAvailableDate: errData.nextAvailableDate,
          statusLoading: false
        });
        setBulkResult({ success: false, onCooldown: true, message: errData.message, nextAvailableDate: errData.nextAvailableDate });
      } else {
        setBulkResult({ success: false, message: errData?.message || 'Failed to send bulk offers.' });
      }
    } finally {
      setBulkSending(false);
    }
  };

  const isMonthlyButtonDisabled = monthlySending || monthlyStatus.statusLoading || monthlyStatus.alreadySentThisMonth;
  const isBulkButtonDisabled = bulkSending || bulkStatus.statusLoading || bulkStatus.onCooldown || (inactiveCustomers.length > 0 && sentIds.size >= inactiveCustomers.length && !bulkStatus.onCooldown);

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Customer <span className="bg-gradient-to-r from-red-400 to-crm-accent bg-clip-text text-transparent">Retention</span>
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Detect and re-engage customers who haven't visited in 3+ days
          </p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <button onClick={() => { fetchInactive(); fetchBulkStatus(); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border hover:bg-white/5 transition-colors self-start mt-1"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
            <RefreshCw size={15} /> Refresh
          </button>

          {/* Bulk Inactive Email Button */}
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleSendBulkInactive}
              disabled={isBulkButtonDisabled}
              title={bulkStatus.onCooldown ? `Resends available: ${formatDate(bulkStatus.nextAvailableDate)}` : 'Send offers to all uncontacted inactive customers'}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all shadow-lg"
            >
              {bulkSending
                ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
                : bulkStatus.onCooldown
                  ? <><CalendarClock size={15} /> On Cooldown</>
                  : sentIds.size >= inactiveCustomers.length && inactiveCustomers.length > 0
                    ? <><CheckCircle size={15} /> All Sent</>
                    : <><Zap size={15} /> Send Offers to Inactive</>
              }
            </button>
            {bulkStatus.onCooldown && bulkStatus.nextAvailableDate && (
              <p className="text-xs font-medium text-orange-400/80">
                Re-enables on {formatDate(bulkStatus.nextAvailableDate)}
              </p>
            )}
          </div>

          {/* Monthly Email Button + Status */}
          <div className="flex flex-col items-end gap-1 ml-4 border-l pl-5" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={handleSendMonthly}
              disabled={isMonthlyButtonDisabled}
              title={monthlyStatus.alreadySentThisMonth ? `Next available: ${formatDate(monthlyStatus.nextAvailableDate)}` : 'Send monthly offer emails to all customers'}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-crm-accent to-crm-cyan text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all shadow-lg"
            >
              {monthlySending
                ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
                : monthlyStatus.alreadySentThisMonth
                  ? <><CalendarClock size={15} /> Sent This Month</>
                  : <><SendHorizonal size={15} /> Send Monthly Emails</>
              }
            </button>
            {monthlyStatus.alreadySentThisMonth && monthlyStatus.nextAvailableDate && (
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Re-enables on {formatDate(monthlyStatus.nextAvailableDate)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bulk Result Banner ── */}
      {bulkResult && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start justify-between gap-4 animate-fade-in ${
          bulkResult.success ? 'border-emerald-500/30 bg-emerald-500/10'
          : bulkResult.onCooldown ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-red-500/30 bg-red-500/10'
        }`}>
          <div className="flex items-start gap-3">
            {bulkResult.success
              ? <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              : bulkResult.onCooldown
                ? <CalendarClock size={20} className="text-amber-400 shrink-0 mt-0.5" />
                : <X size={20} className="text-red-400 shrink-0 mt-0.5" />}
            <div>
              <p className={`font-bold ${bulkResult.success ? 'text-emerald-300' : bulkResult.onCooldown ? 'text-amber-300' : 'text-red-300'}`}>
                {bulkResult.message}
              </p>
              {bulkResult.success && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {bulkResult.sent} emails successfully delivered · {bulkResult.failed || 0} failed from {bulkResult.processed} eligible
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setBulkResult(null)} style={{ color: 'var(--text-muted)' }} className="shrink-0 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Monthly Result Banner ── */}
      {monthlyResult && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start justify-between gap-4 animate-fade-in ${
          monthlyResult.success ? 'border-emerald-500/30 bg-emerald-500/10'
          : monthlyResult.alreadySent ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-red-500/30 bg-red-500/10'
        }`}>
          <div className="flex items-start gap-3">
            {monthlyResult.success
              ? <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              : monthlyResult.alreadySent
                ? <CalendarClock size={20} className="text-amber-400 shrink-0 mt-0.5" />
                : <X size={20} className="text-red-400 shrink-0 mt-0.5" />}
            <div>
              <p className={`font-bold ${monthlyResult.success ? 'text-emerald-300' : monthlyResult.alreadySent ? 'text-amber-300' : 'text-red-300'}`}>
                {monthlyResult.message}
              </p>
            </div>
          </div>
          <button onClick={() => setMonthlyResult(null)} style={{ color: 'var(--text-muted)' }} className="shrink-0 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Inactive Alert Banner ── */}
      {!loading && inactiveCustomers.length > 0 && (
        sentIds.size >= inactiveCustomers.length ? (
          <div className="mb-6 p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-4 animate-fade-in">
            <CheckCircle size={24} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-emerald-300 mb-1">All inactive customers have been contacted!</h3>
              <p className="text-sm text-emerald-400/80">Great job! Win-back emails have been sent to all eligible customers this cycle.</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-5 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-4 animate-fade-in">
            <AlertTriangle size={24} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-300 mb-1">{inactiveCustomers.length - sentIds.size} customers need re-engagement!</h3>
              <p className="text-sm text-red-400/80">Click the orange button above to bulk-dispatch your win-back offers.</p>
            </div>
          </div>
        )
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Inactive (3+ days)', val: inactiveCustomers.length, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Uncontacted', val: inactiveCustomers.length > 0 ? (inactiveCustomers.length - sentIds.size) : 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'At Risk Revenue', val: `₹${inactiveCustomers.reduce((s, c) => s + (c.totalSpending || 0), 0).toLocaleString()}`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Offers Sent', val: sentIds.size, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-xl border ${s.bg} flex flex-col gap-1`} style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color}`}>{loading ? '...' : s.val}</p>
          </div>
        ))}
      </div>

      {/* ── Monthly Status Info Card ── */}
      {!monthlyStatus.statusLoading && (
        <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${monthlyStatus.alreadySentThisMonth ? 'bg-emerald-500/10' : 'bg-crm-cyan/10'}`}>
              <Users size={18} className={monthlyStatus.alreadySentThisMonth ? 'text-emerald-400' : 'text-crm-cyan'} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Monthly Email Campaign</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {monthlyStatus.alreadySentThisMonth
                  ? `Last sent: ${formatDate(monthlyStatus.lastSent)} · Refreshes ${formatDate(monthlyStatus.nextAvailableDate)}`
                  : 'Not yet sent this month — click "Send Monthly Emails" to begin'
                }
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${monthlyStatus.alreadySentThisMonth ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-crm-cyan/10 text-crm-cyan border border-crm-cyan/20'}`}>
            {monthlyStatus.alreadySentThisMonth ? '✓ Sent This Month' : '○ Ready to Send'}
          </span>
        </div>
      )}

      {/* ── Inactive Customers Table ── */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}>
          <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock size={16} className="text-red-400" /> Inactive Customers
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['Customer', 'Email', 'Spending', 'Days Inactive', 'Points', 'Status', 'View'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-left" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="py-10 text-center animate-pulse text-crm-teal font-semibold">Loading...</td></tr>
              ) : inactiveCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <CheckCircle size={36} className="mx-auto mb-3 text-emerald-400 opacity-60" />
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Great! No inactive customers</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>All customers visited within 3 days</p>
                  </td>
                </tr>
              ) : inactiveCustomers.map(c => {
                const days = daysSince(c.lastVisitDate);
                const wasSent = sentIds.has(c._id);
                return (
                  <tr key={c._id} className={`border-t transition-colors ${wasSent ? 'bg-emerald-500/5' : 'hover:bg-white/[0.02]'}`} style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: c.email ? 'var(--text-muted)' : '#f87171' }}>
                      {c.email || 'No email'}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">₹{c.totalSpending?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${days > 7 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {days}d ago
                      </span>
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-bold">{c.rewardPoints || 0}</td>
                    <td className="px-4 py-3">
                      {wasSent ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-max">
                          <CheckCircle size={13} /> Offer Sent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 w-max">
                          <Clock size={13} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/customers/${c._id}`}
                        className="p-2 inline-flex rounded-lg border hover:bg-white/5 transition-colors"
                        style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Retention;
