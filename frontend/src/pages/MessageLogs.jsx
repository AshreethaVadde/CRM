import { useState, useEffect } from 'react';
import { Mail, MessageSquare, CheckCircle2, XCircle, Search, Calendar, RefreshCw } from 'lucide-react';
import api from '../services/api';

const MessageLogs = () => {
  const [messages, setMessages] = parseInt([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages/all');
      setMessages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filtered = (Array.isArray(messages) ? messages : []).filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.customerId?.name?.toLowerCase().includes(term) ||
      m.customerId?.phone?.includes(term) ||
      (m.customerId?.email && m.customerId.email.toLowerCase().includes(term)) ||
      m.subject.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Message <span className="bg-gradient-to-r from-crm-cyan to-crm-teal bg-clip-text text-transparent">Logs</span>
          </h1>
          <p className="mt-1 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>
            Track SMS, Email & In-App delivery history in real-time
          </p>
        </div>
        <button
          onClick={fetchMessages}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border hover:bg-white/5 transition-colors"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="glass-card flex flex-col mb-6 p-4">
        <div className="flex items-center gap-2 w-full max-w-sm px-4 py-2.5 rounded-xl border focus-within:border-crm-cyan transition-all"
          style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text" placeholder="Search by customer name, phone, or subject..."
            className="bg-transparent border-none outline-none text-sm font-medium flex-1"
            style={{ color: 'var(--text-primary)' }}
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}>
                <th className="px-5 py-4 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Customer</th>
                <th className="px-5 py-4 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Channel</th>
                <th className="px-5 py-4 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Subject</th>
                <th className="px-5 py-4 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="px-5 py-4 text-right font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date Sent</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="py-12 text-center text-crm-teal font-semibold animate-pulse">Loading logs...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    No messages found matching your criteria.
                  </td>
                </tr>
              ) : filtered.map((msg) => (
                <tr key={msg._id} className="border-t hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{msg.customerId?.name || 'Unknown'}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {msg.channel === 'sms' ? msg.customerId?.phone : (msg.customerId?.email || msg.customerId?.phone)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {msg.channel === 'sms' ? <MessageSquare size={14} className="text-emerald-400" /> : <Mail size={14} className="text-crm-cyan" />}
                      <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>{msg.channel}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs font-medium max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }} title={msg.subject}>{msg.subject}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-max ${
                      msg.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {msg.status === 'sent' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {msg.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      {new Date(msg.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
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

export default MessageLogs;
