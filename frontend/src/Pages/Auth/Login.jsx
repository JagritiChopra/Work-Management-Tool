import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Hooks/useAuth';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const from         = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,700;1,300&family=Manrope:wght@300;400;600;800&display=swap');
        .glass-card {
          background: rgba(53, 53, 52, 0.4);
          backdrop-filter: blur(40px);
          border-top: 1px solid rgba(143, 246, 208, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3);
        }
        .bg-glow-mint {
          background: radial-gradient(circle at 50% 50%, rgba(115,217,181,0.15) 0%, transparent 70%);
        }
        .bg-glow-gold {
          background: radial-gradient(circle at 50% 50%, rgba(233,196,0,0.1) 0%, transparent 60%);
        }
        .font-headline { font-family: 'Newsreader', serif; }
        .font-body     { font-family: 'Manrope', sans-serif; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0e0e0e inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>

      <div
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: '#131313', fontFamily: "'Manrope', sans-serif" }}
      >
        {/* Background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-glow-mint pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-glow-gold pointer-events-none" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full blur-[120px]" style={{ background: '#8ff6d0' }} />
          <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] rounded-full blur-[150px]" style={{ background: '#e9c400' }} />
        </div>

        {/* Nav */}
        <header className="fixed top-0 w-full flex justify-center items-center py-8 z-50">
          <span className="font-headline text-2xl font-light italic text-white tracking-wide">Quantum Pro</span>
        </header>

        {/* Card */}
        <main className="relative z-10 w-full max-w-md px-6">
          <div className="glass-card rounded-xl p-10 flex flex-col gap-8">
            <div className="text-center space-y-2">
              <h1 className="font-headline text-4xl text-white font-light tracking-tight">Welcome Back</h1>
              <p className="font-body text-sm tracking-wide" style={{ color: '#bdc9c2' }}>
                Enter your credentials to access the atelier.
              </p>
            </div>

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              {/* Error */}
              {error && (
                <div className="rounded-lg px-4 py-3 text-xs tracking-wide" style={{ background: 'rgba(147,0,10,0.3)', color: '#ffb4ab', border: '1px solid rgba(255,180,171,0.2)' }}>
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="block font-body text-[10px] uppercase tracking-[0.2em] ml-1" style={{ color: '#bdc9c2' }}>
                  Email Address
                </label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="name@quantumpro.io"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-lg py-4 px-5 text-white font-body outline-none transition-all duration-300 placeholder:text-gray-600"
                    style={{ background: '#0e0e0e', border: 'none' }}
                    onFocus={e => e.target.parentNode.querySelector('.border-overlay').style.borderColor = 'rgba(143,246,208,0.3)'}
                    onBlur={e => e.target.parentNode.querySelector('.border-overlay').style.borderColor = 'rgba(62,73,68,0.4)'}
                  />
                  <div className="border-overlay absolute inset-0 rounded-lg pointer-events-none transition-colors duration-300" style={{ border: '1px solid rgba(62,73,68,0.4)' }} />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="font-body text-[10px] uppercase tracking-[0.2em]" style={{ color: '#bdc9c2' }}>
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-body text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-white"
                    style={{ color: '#73d9b5' }}
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-lg py-4 px-5 text-white font-body outline-none transition-all duration-300 placeholder:text-gray-600"
                    style={{ background: '#0e0e0e', border: 'none' }}
                    onFocus={e => e.target.parentNode.querySelector('.border-overlay').style.borderColor = 'rgba(143,246,208,0.3)'}
                    onBlur={e => e.target.parentNode.querySelector('.border-overlay').style.borderColor = 'rgba(62,73,68,0.4)'}
                  />
                  <div className="border-overlay absolute inset-0 rounded-lg pointer-events-none transition-colors duration-300" style={{ border: '1px solid rgba(62,73,68,0.4)' }} />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 font-bold rounded-xl transition-all duration-500 active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(to right, #8ff6d0, #73d9b5)',
                    color: '#003829',
                    boxShadow: '0 4px 20px rgba(143,246,208,0.15)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {loading ? 'Logging in…' : 'Login to Workspace'}
                </button>
              </div>
            </form>

            <div className="text-center">
              <p className="font-body text-xs" style={{ color: '#bdc9c2' }}>
                Don't have an account?{' '}
                <Link to="/register" className="font-bold ml-1 transition-colors hover:text-white" style={{ color: '#fff' }}>
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 w-full flex flex-col items-center gap-4 pb-8 z-50">
          <div className="font-body text-[10px] uppercase tracking-[0.2em]" style={{ color: '#4b5563' }}>
            © 2024 Quantum Pro. Engineered for the Luminescent Atelier.
          </div>
          <nav className="flex gap-6">
            {['Privacy', 'Terms', 'Support'].map((l) => (
              <a key={l} href="#" className="font-body text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-white" style={{ color: '#4b5563' }}>
                {l}
              </a>
            ))}
          </nav>
        </footer>
      </div>
    </>
  );
}
