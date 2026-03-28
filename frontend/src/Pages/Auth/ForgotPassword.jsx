import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { forgotPassword, resetPassword, verifyEmail } from '../../Services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await forgotPassword(email);
      setSuccess(data.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We'll send a recovery link to your inbox">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <StatusBanner error={error} success={success} />

        <Field label="Email Address">
          <AuthInput
            name="email"
            type="email"
            required
            placeholder="name@quantumpro.io"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <div className="pt-2">
          <GoldButton disabled={loading || !!success}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </GoldButton>
        </div>
      </form>

      <div className="text-center mt-8">
        <p className="font-body text-xs" style={{ color: '#bdc9c2' }}>
          Remembered it?{' '}
          <Link
            to="/login"
            className="underline underline-offset-4 ml-1 hover:text-white transition-colors"
            style={{ color: '#73d9b5' }}
          >
            Back to login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default ForgotPassword;

export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword(token, {
        password: form.password,
        passwordConfirm: form.confirm,
      });
      navigate('/login', { state: { message: 'Password reset successful. Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="New password" subtitle="Choose something strong and memorable">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <StatusBanner error={error} />

        <Field label="New Password">
          <AuthInput
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="........"
            value={form.password}
            onChange={handleChange}
          />
        </Field>

        <Field label="Confirm Password">
          <AuthInput
            name="confirm"
            type="password"
            required
            placeholder="........"
            value={form.confirm}
            onChange={handleChange}
          />
        </Field>

        <div className="pt-2">
          <GoldButton disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </GoldButton>
        </div>
      </form>
    </AuthShell>
  );
}

export function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let timeoutId;

    (async () => {
      try {
        const { data } = await verifyEmail(token);
        if (data.data?.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
        }

        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        timeoutId = window.setTimeout(() => navigate('/dashboard'), 2500);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
      }
    })();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [navigate, token]);

  const isVerifying = status === 'verifying';
  const isSuccess = status === 'success';

  return (
    <AuthShell
      title={isVerifying ? 'Verifying...' : isSuccess ? 'Verified!' : 'Link expired'}
      subtitle={isVerifying ? 'Please wait a moment' : message}
    >
      <div className="flex flex-col items-center gap-6 py-4">
        {isVerifying && (
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#73d9b5', borderTopColor: 'transparent' }}
          />
        )}
        {isSuccess && (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'rgba(0,114,87,0.2)', border: '1px solid rgba(115,217,181,0.3)' }}
          >
            OK
          </div>
        )}
        {status === 'error' && (
          <>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{ background: 'rgba(147,0,10,0.2)', border: '1px solid rgba(255,180,171,0.3)' }}
            >
              X
            </div>
            <Link
              to="/login"
              className="font-body text-xs underline underline-offset-4 hover:text-white transition-colors"
              style={{ color: '#73d9b5' }}
            >
              Back to login
            </Link>
          </>
        )}
        {isSuccess && (
          <p className="font-body text-xs" style={{ color: '#bdc9c2' }}>
            Redirecting to your workspace...
          </p>
        )}
      </div>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden px-6 py-24"
      style={{ background: '#131313', fontFamily: "'Manrope', sans-serif" }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
        <div
          className="absolute rounded-full"
          style={{
            top: '-20%',
            left: '-10%',
            width: '60%',
            height: '60%',
            filter: 'blur(120px)',
            background: 'radial-gradient(circle at 50% 50%, rgba(115,217,181,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '-20%',
            right: '-10%',
            width: '50%',
            height: '50%',
            filter: 'blur(100px)',
            background: 'radial-gradient(circle at 50% 50%, rgba(233,196,0,0.1) 0%, transparent 70%)',
          }}
        />
      </div>

      <nav className="fixed top-0 w-full flex justify-center items-center py-8 z-50">
        <span className="text-2xl font-light italic text-white tracking-wide" style={{ fontFamily: "'Newsreader', serif" }}>
          Quantum Pro
        </span>
      </nav>

      <div className="max-w-[480px] w-full relative z-10">
        <div
          className="rounded-xl p-8 shadow-2xl"
          style={{
            borderRadius: '1rem',
            background: 'rgba(53,53,52,0.4)',
            backdropFilter: 'blur(40px)',
            borderTop: '1px solid rgba(143,246,208,0.15)',
            borderLeft: '1px solid rgba(143,246,208,0.05)',
          }}
        >
          <header className="text-center mb-10">
            <h1
              className="text-white mb-3"
              style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300 }}
            >
              {title}
            </h1>
            <p className="text-sm font-light uppercase tracking-widest" style={{ color: '#bdc9c2' }}>
              {subtitle}
            </p>
          </header>
            {children}
        </div>
        <div className="absolute -z-10 -bottom-6 -right-6 w-32 h-32 opacity-20 rotate-12">
          <div className="w-full h-full rounded-xl" style={{ border: '1px solid #8ff6d0' }} />
        </div>
      </div>

      <footer className="fixed bottom-0 w-full flex flex-col items-center gap-4 pb-8 z-50">
        <div className="flex gap-8">
          {['Privacy', 'Terms', 'Support'].map((linkLabel) => (
            <a
              key={linkLabel}
              href="#"
              className="text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors"
              style={{ color: '#4b5563' }}
            >
              {linkLabel}
            </a>
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#4b5563' }}>
          Copyright 2024 Quantum Pro. Engineered for the Luminescent Atelier.
        </p>
      </footer>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] uppercase tracking-[0.2em] px-1" style={{ color: '#bdc9c2' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function AuthInput(props) {
  return (
    <input
      className="w-full rounded-lg px-4 py-3.5 text-white font-light outline-none transition-colors placeholder:text-gray-600"
      style={{ background: '#0e0e0e', border: '1px solid rgba(62,73,68,0.3)', fontFamily: "'Manrope', sans-serif" }}
      onFocus={(event) => {
        event.target.style.borderColor = 'rgba(143,246,208,0.4)';
      }}
      onBlur={(event) => {
        event.target.style.borderColor = 'rgba(62,73,68,0.3)';
      }}
      {...props}
    />
  );
}

function GoldButton({ children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full py-4 px-6 rounded-xl font-semibold text-sm uppercase tracking-widest transition-all duration-500 active:scale-95 disabled:opacity-60"
      style={{
        background: 'linear-gradient(to right, #ffe16d, #e9c400)',
        color: '#221b00',
        boxShadow: '0 0 20px rgba(233,196,0,0.2)',
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {children}
    </button>
  );
}

function StatusBanner({ error, success }) {
  if (!error && !success) return null;

  return (
    <div
      className="rounded-lg px-4 py-3 text-xs tracking-wide"
      style={
        error
          ? { background: 'rgba(147,0,10,0.3)', color: '#ffb4ab', border: '1px solid rgba(255,180,171,0.2)' }
          : { background: 'rgba(0,114,87,0.2)', color: '#73d9b5', border: '1px solid rgba(115,217,181,0.2)' }
      }
    >
      {error || success}
    </div>
  );
}

