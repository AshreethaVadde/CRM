import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password, 'Admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-crm-darker overflow-hidden relative">
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-crm-accent/20 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[30rem] h-[30rem] bg-crm-teal/10 rounded-full blur-[120px] animate-[float_7s_ease-in-out_infinite_reverse]"></div>

      <div className="glass-card p-10 rounded-3xl w-full max-w-md shadow-2xl relative z-10 mx-4 border-t border-white/20">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold mb-2 text-white drop-shadow-md">Create Account</h1>
          <p className="text-sm text-crm-light/80 font-medium">Join ShopCRM to manage your retail empire</p>
        </div>

        {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium border border-red-500/20 shadow-inner">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold text-crm-light mb-2 uppercase tracking-wide">Full Name</label>
            <input type="text" required className="input-field shadow-inner" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-crm-light mb-2 uppercase tracking-wide">Email Address</label>
            <input type="email" required className="input-field shadow-inner" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-crm-light mb-2 uppercase tracking-wide">Password</label>
            <input type="password" required className="input-field shadow-inner" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-4 py-4 text-lg shadow-[0_0_20px_-5px_rgba(20,184,166,0.4)]">
            {loading ? 'Setting up workspace...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center mt-8 text-crm-light/70 text-sm font-medium">
          Already have an account? <Link to="/login" className="text-white hover:text-crm-cyan hover:underline transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
