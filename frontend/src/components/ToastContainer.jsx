import { useNotifications } from '../context/NotificationContext';
import { X, Star, TrendingUp, Bell, Info } from 'lucide-react';

const iconMap = {
  vip_upgrade: <Star size={18} className="text-amber-400" />,
  tier_upgrade: <TrendingUp size={18} className="text-purple-400" />,
  inactive_alert: <Bell size={18} className="text-red-400" />,
  general: <Info size={18} className="text-crm-cyan" />,
  campaign: <Bell size={18} className="text-green-400" />,
};

const ToastContainer = () => {
  const { toasts } = useNotifications();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.toastId}
          className="animate-slide-down glass flex items-start gap-3 p-4 rounded-xl shadow-2xl border border-white/10"
          style={{ minWidth: '300px' }}
        >
          <div className="pt-0.5">{iconMap[toast.type] || iconMap.general}</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{toast.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
