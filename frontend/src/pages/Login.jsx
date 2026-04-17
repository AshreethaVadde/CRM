import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden relative" style={{ background: 'var(--bg-base)' }}>
      {/* Theme toggle */}
      <button onClick={toggleTheme} className="absolute top-5 right-5 p-2.5 rounded-xl border hover:bg-white/10 transition-colors z-10"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
        {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-crm-cyan" />}
      </button>

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] animate-float pointer-events-none" style={{ background: 'rgba(20,184,166,0.15)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(14,165,233,0.1)' }} />

      <div className="glass-card p-10 rounded-3xl w-full max-w-md shadow-2xl relative z-10 mx-4">
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-crm-teal to-crm-cyan mx-auto flex items-center justify-center mb-4 shadow-lg shadow-crm-cyan/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="9" r="3" fill="white" opacity="0.9"/>
              <circle cx="15" cy="9" r="3" fill="white" opacity="0.6"/>
              <path d="M3 19c0-3.314 2.686-6 6-6h6c3.314 0 6 2.686 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold mb-1 bg-gradient-to-r from-crm-teal via-crm-cyan to-crm-accent bg-clip-text text-transparent">ShopCRM</h1>
          <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>Premium Edition</p>
        </div>

        {error && <div className="p-4 rounded-xl mb-5 text-sm font-medium border bg-red-500/10 text-red-400 border-red-500/20">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Email Address</label>
            <input type="email" required className="input-field" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Password</label>
            <input type="password" required className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2 py-4 text-base">
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          New to ShopCRM?{' '}
          <Link to="/signup" className="text-crm-cyan hover:underline transition-colors font-semibold">Request Access</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
