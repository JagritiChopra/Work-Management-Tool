import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Hooks/useAuth';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', passwordConfirm: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side guard so we don't even hit the network
    if (form.password !== form.passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Send all four fields — backend validator requires passwordConfirm
      const message = await register(form.name, form.email, form.password, form.passwordConfirm);
      setSuccess(message || 'Registration successful! Please check your email to verify your account.');
      setForm({ name: '', email: '', password: '', passwordConfirm: '' });
    } catch (err) {
      // Show first validation error if available, else fallback message
      const validationErrors = err.response?.data?.errors;
      if (validationErrors?.length) {
        setError(validationErrors.map((e) => e.message).join(' · '));
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Manrope:wght@200;300;400;500;600;700;800&display=swap');
        .glass-card {
          background: rgba(53, 53, 52, 0.4);
          backdrop-filter: blur(40px);
          border-top: 1px solid rgba(143, 246, 208, 0.15);
          border-left: 1px solid rgba(143, 246, 208, 0.05);
        }
        .glow-mint {
          background: radial-gradient(circle at 50% 50%, rgba(115,217,181,0.15) 0%, transparent 70%);
        }
        .glow-gold {
          background: radial-gradient(circle at 50% 50%, rgba(233,196,0,0.1) 0%, transparent 70%);
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
        className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden px-6 py-24"
        style={{ background: '#131313', fontFamily: "'Manrope', sans-serif" }}
      >
        {/* Background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
          <div className="absolute glow-mint rounded-full" style={{ top: '-20%', left: '-10%', width: '60%', height: '60%', filter: 'blur(120px)' }} />
          <div className="absolute glow-gold rounded-full" style={{ bottom: '-20%', right: '-10%', width: '50%', height: '50%', filter: 'blur(100px)' }} />
          <div className="absolute glow-mint rounded-full opacity-30" style={{ top: '25%', right: 0, width: '30%', height: '40%', filter: 'blur(150px)' }} />
        </div>

        {/* Nav */}
        <nav className="fixed top-0 w-full flex justify-center items-center py-8 z-50">
          <span className="font-headline text-2xl font-light italic text-white tracking-wide">Quantum Pro</span>
        </nav>

        {/* Card */}
        <div className="max-w-[480px] w-full relative z-10">
          <div className="glass-card rounded-xl p-8 shadow-2xl" style={{ borderRadius: '1rem' }}>
            {/* Header */}
            <header className="text-center mb-10">
              <h1 className="font-headline text-white mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300 }}>
                Begin your journey
              </h1>
              <p className="font-body text-sm font-light uppercase tracking-widest" style={{ color: '#bdc9c2' }}>
                Enter the Luminescent Atelier
              </p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error */}
              {error && (
                <div className="rounded-lg px-4 py-3 font-body text-xs tracking-wide" style={{ background: 'rgba(147,0,10,0.3)', color: '#ffb4ab', border: '1px solid rgba(255,180,171,0.2)' }}>
                  {error}
                </div>
              )}
              {/* Success */}
              {success && (
                <div className="rounded-lg px-4 py-3 font-body text-xs tracking-wide" style={{ background: 'rgba(0,114,87,0.2)', color: '#73d9b5', border: '1px solid rgba(115,217,181,0.2)' }}>
                  {success}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <label className="block font-body text-[10px] uppercase tracking-[0.2em] px-1" style={{ color: '#bdc9c2' }}>
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Julian Voss"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-lg px-4 py-3.5 text-white font-body font-light outline-none transition-colors placeholder:text-gray-600"
                  style={{ background: '#0e0e0e', border: '1px solid rgba(62,73,68,0.3)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(143,246,208,0.4)')}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(62,73,68,0.3)')}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block font-body text-[10px] uppercase tracking-[0.2em] px-1" style={{ color: '#bdc9c2' }}>
                  Professional Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="voss@quantumpro.io"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-lg px-4 py-3.5 text-white font-body font-light outline-none transition-colors placeholder:text-gray-600"
                  style={{ background: '#0e0e0e', border: '1px solid rgba(62,73,68,0.3)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(143,246,208,0.4)')}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(62,73,68,0.3)')}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block font-body text-[10px] uppercase tracking-[0.2em] px-1" style={{ color: '#bdc9c2' }}>
                  Secure Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-lg px-4 py-3.5 text-white font-body font-light outline-none transition-colors placeholder:text-gray-600"
                  style={{ background: '#0e0e0e', border: '1px solid rgba(62,73,68,0.3)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(143,246,208,0.4)')}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(62,73,68,0.3)')}
                />
                <p className="font-body text-[10px] px-1" style={{ color: 'rgba(189,201,194,0.5)' }}>
                  Min 8 chars · uppercase · lowercase · number
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block font-body text-[10px] uppercase tracking-[0.2em] px-1" style={{ color: '#bdc9c2' }}>
                  Confirm Password
                </label>
                <input
                  name="passwordConfirm"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  className="w-full rounded-lg px-4 py-3.5 text-white font-body font-light outline-none transition-colors placeholder:text-gray-600"
                  style={{ background: '#0e0e0e', border: '1px solid rgba(62,73,68,0.3)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(143,246,208,0.4)')}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(62,73,68,0.3)')}
                />
              </div>

              {/* CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !!success}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-sm uppercase tracking-widest transition-all duration-500 active:scale-95 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(to right, #ffe16d, #e9c400)',
                    color: '#221b00',
                    boxShadow: '0 0 20px rgba(233,196,0,0.2)',
                  }}
                >
                  {loading ? 'Creating Account…' : 'Create Account'}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-8">
              <div className="flex-grow border-t" style={{ borderColor: 'rgba(62,73,68,0.2)' }} />
              <span className="flex-shrink mx-4 font-body text-[10px] uppercase tracking-widest" style={{ color: 'rgba(189,201,194,0.6)' }}>
                Authentication tier
              </span>
              <div className="flex-grow border-t" style={{ borderColor: 'rgba(62,73,68,0.2)' }} />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Google', icon: '🌐' },
                { label: 'Apple',  icon: '' },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors font-body text-[11px] uppercase tracking-wider font-medium hover:text-white"
                  style={{ background: 'rgba(42,42,42,0.5)', border: '1px solid rgba(62,73,68,0.2)', color: '#bdc9c2' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(53,53,52,1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(42,42,42,0.5)')}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Footer link */}
            <footer className="mt-10 text-center">
              <p className="font-body text-xs font-light tracking-wide" style={{ color: '#bdc9c2' }}>
                Already part of the atelier?{' '}
                <Link
                  to="/login"
                  className="underline underline-offset-4 ml-1 transition-colors hover:text-white"
                  style={{ color: '#73d9b5' }}
                >
                  Login
                </Link>
              </p>
            </footer>
          </div>

          {/* Decorative */}
          <div className="absolute -z-10 -bottom-6 -right-6 w-32 h-32 opacity-20 rotate-12">
            <div className="w-full h-full rounded-xl" style={{ border: '1px solid #8ff6d0' }} />
          </div>
        </div>

        {/* Footer */}
        <footer className="fixed bottom-0 w-full flex flex-col items-center gap-4 pb-8 z-50">
          <div className="flex gap-8">
            {['Privacy', 'Terms', 'Support'].map((l) => (
              <a key={l} href="#" className="font-body text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-white" style={{ color: '#4b5563' }}>
                {l}
              </a>
            ))}
          </div>
          <p className="font-body text-[10px] uppercase tracking-[0.2em]" style={{ color: '#4b5563' }}>
            © 2024 Quantum Pro. Engineered for the Luminescent Atelier.
          </p>
        </footer>
      </div>
    </>
  );
}
