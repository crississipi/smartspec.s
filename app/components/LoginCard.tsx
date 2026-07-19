'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { FaArrowLeft } from 'react-icons/fa';
import { LogoIcon } from '@/lib/icons';

// Theme configuration
const theme = {
  light: {
    bg: '#ffffff',
    bgHover: '#f9fafb',
    text: '#0d0d0d',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    primary: '#10b981',
    primaryHover: '#059669',
    accent: '#3b82f6',
    accentHover: '#2563eb',
    error: '#dc2626',
    errorBg: '#fef2f2',
    divider: '#d1d5db',
  },
  dark: {
    bg: '#1a1a1a',
    bgHover: '#262626',
    text: '#f5f5f5',
    textSecondary: '#d1d5db',
    border: '#404040',
    borderLight: '#333333',
    primary: '#10b981',
    primaryHover: '#059669',
    accent: '#60a5fa',
    accentHover: '#3b82f6',
    error: '#ef4444',
    errorBg: '#7f1d1d',
    divider: '#4b5563',
  },
};

export default function LoginCard({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'forgot-otp' | 'forgot-reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nightMode, setNightMode] = useState(false);

  // Detect dark mode preference
  useEffect(() => {
    // Check on mount and listen for changes
    const checkDarkMode = () => {
      setNightMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Listen for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const current = nightMode ? theme.dark : theme.light;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError(result.error);
    } else {
      onLogin();
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        return;
      }

      // Auto login after signup
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        onLogin();
      }
    } catch (err) {
      setError('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setMode('forgot-otp');
      }
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpString = otp.join('');
    if (otpString.length !== 5) {
      setError('Please enter complete OTP');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setMode('forgot-reset');
      }
    } catch (err) {
      setError('OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join(''), password: newPassword }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setMode('login');
        setEmail('');
        setPassword('');
        setOtp(['', '', '', '', '']);
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setError('Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '420px',
    borderRadius: '12px',
    border: `1px solid ${current.border}`,
    backgroundColor: current.bg,
    boxShadow: nightMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden' as const,
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '8px',
  };

  const headerTitleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: current.text,
    margin: 0,
  };

  const headerSubtitleStyle = {
    color: current.textSecondary,
    fontSize: '14px',
    marginTop: '4px',
    margin: 0,
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: `1px solid ${current.border}`,
    backgroundColor: current.bg,
    color: current.text,
    fontSize: '14px',
    outline: 'none' as const,
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  };

  const inputFocusStyle = {
    ...inputStyle,
    borderColor: current.primary,
    boxShadow: `0 0 0 3px ${nightMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`,
  };

  const buttonPrimaryStyle = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: current.primary,
    color: '#ffffff',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: loading ? 0.5 : 1,
  };

  const buttonSecondaryStyle = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: current.bgHover,
    color: current.text,
    border: `1px solid ${current.border}`,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const dividerStyle = {
    display: 'flex',
    alignItems: 'center',
    margin: '8px 0',
    gap: '12px',
  };

  const dividerLineStyle = {
    flex: 1,
    height: '1px',
    backgroundColor: current.border,
  };

  const dividerTextStyle = {
    color: current.textSecondary,
    fontSize: '13px',
    padding: '0 8px',
  };

  const linkStyle = {
    fontSize: '13px',
    color: current.primary,
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: '500',
    border: 'none',
    background: 'none',
    padding: '4px 0',
  };

  const errorBoxStyle = {
    padding: '12px 16px',
    fontSize: '13px',
    color: current.error,
    backgroundColor: nightMode ? `${current.errorBg}20` : current.errorBg,
    borderRadius: '8px',
    textAlign: 'center' as const,
  };

  const contentStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px',
    gap: '16px',
  };

  return (
    <div style={containerStyle}>
      <motion.div
        style={cardStyle}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {error && (
          <div style={{ ...errorBoxStyle, margin: '16px 24px 0' }}>
            {error}
          </div>
        )}

        {mode === 'login' && (
          <div style={contentStyle}>
            <div style={headerStyle}>
              <h2 style={headerTitleStyle}>Welcome back</h2>
              <p style={headerSubtitleStyle}>Log in to SmartSpecs</p>
            </div>

            <form onSubmit={handleLogin} style={formStyle}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />

              <button
                type="button"
                style={linkStyle}
                onClick={() => setMode('forgot')}
                disabled={loading}
              >
                Forgot password?
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...buttonPrimaryStyle,
                  marginTop: '12px',
                  backgroundColor: loading ? current.primary : current.primary,
                } as React.CSSProperties}
                onMouseOver={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.backgroundColor = current.primaryHover;
                  }
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = current.primary;
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div style={dividerStyle}>
              <div style={dividerLineStyle}></div>
              <span style={dividerTextStyle}>or</span>
              <div style={dividerLineStyle}></div>
            </div>

            <button
              type="button"
              style={buttonSecondaryStyle}
              onClick={() => signIn('google', { callbackUrl: '/' })}
              disabled={loading}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = current.bgHover;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <FcGoogle size={18} />
                Continue with Google
              </div>
            </button>

            <p style={{ textAlign: 'center' as const, fontSize: '14px', color: current.textSecondary, margin: 0, marginTop: '8px' }}>
              Don't have an account?{' '}
              <button
                type="button"
                style={linkStyle}
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {mode === 'signup' && (
          <div style={contentStyle}>
            <div style={headerStyle}>
              <h2 style={headerTitleStyle}>Create account</h2>
              <p style={headerSubtitleStyle}>Get started with SmartSpecs</p>
            </div>

            <form onSubmit={handleSignup} style={formStyle}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...buttonPrimaryStyle,
                  marginTop: '8px',
                } as React.CSSProperties}
                onMouseOver={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.backgroundColor = current.primaryHover;
                  }
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = current.primary;
                }}
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>

            <div style={dividerStyle}>
              <div style={dividerLineStyle}></div>
              <span style={dividerTextStyle}>or</span>
              <div style={dividerLineStyle}></div>
            </div>

            <button
              type="button"
              style={buttonSecondaryStyle}
              onClick={() => signIn('google', { callbackUrl: '/' })}
              disabled={loading}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <FcGoogle size={18} />
                Continue with Google
              </div>
            </button>

            <p style={{ textAlign: 'center' as const, fontSize: '14px', color: current.textSecondary, margin: 0, marginTop: '8px' }}>
              Already have an account?{' '}
              <button
                type="button"
                style={linkStyle}
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        {mode === 'forgot' && (
          <div style={contentStyle}>
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{ ...linkStyle, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
              disabled={loading}
            >
              <FaArrowLeft size={14} /> Back
            </button>

            <div style={headerStyle}>
              <h2 style={headerTitleStyle}>Forgot password?</h2>
              <p style={headerSubtitleStyle}>We'll send you an OTP to reset it</p>
            </div>

            <form onSubmit={handleForgotPassword} style={formStyle}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />

              <button
                type="submit"
                disabled={loading}
                style={buttonPrimaryStyle as React.CSSProperties}
                onMouseOver={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.backgroundColor = current.primaryHover;
                  }
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = current.primary;
                }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </div>
        )}

        {mode === 'forgot-otp' && (
          <div style={contentStyle}>
            <button
              type="button"
              onClick={() => setMode('forgot')}
              style={{ ...linkStyle, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
              disabled={loading}
            >
              <FaArrowLeft size={14} /> Back
            </button>

            <div style={headerStyle}>
              <h2 style={headerTitleStyle}>Verify OTP</h2>
              <p style={headerSubtitleStyle}>Enter the code sent to {email}</p>
            </div>

            <form onSubmit={handleVerifyOtp} style={{ ...formStyle, gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    placeholder="0"
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.slice(-1);
                      if (val === '' || /^\d$/.test(val)) {
                        const newOtp = [...otp];
                        newOtp[i] = val;
                        setOtp(newOtp);
                        if (val && i < 4) {
                          const inputs = document.querySelectorAll('input[data-otp]');
                          (inputs[i + 1] as HTMLInputElement)?.focus();
                        }
                      }
                    }}
                    data-otp={i}
                    disabled={loading}
                    style={{
                      width: '48px',
                      height: '48px',
                      textAlign: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      border: `2px solid ${current.border}`,
                      borderRadius: '8px',
                      backgroundColor: current.bg,
                      color: current.text,
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = current.primary;
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = current.border;
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={buttonPrimaryStyle as React.CSSProperties}
                onMouseOver={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.backgroundColor = current.primaryHover;
                  }
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = current.primary;
                }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          </div>
        )}

        {mode === 'forgot-reset' && (
          <div style={contentStyle}>
            <button
              type="button"
              onClick={() => setMode('forgot-otp')}
              style={{ ...linkStyle, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
              disabled={loading}
            >
              <FaArrowLeft size={14} /> Back
            </button>

            <div style={headerStyle}>
              <h2 style={headerTitleStyle}>Create new password</h2>
              <p style={headerSubtitleStyle}>Enter a strong password (minimum 8 characters)</p>
            </div>

            <form onSubmit={handleResetPassword} style={formStyle}>
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...buttonPrimaryStyle,
                  marginTop: '8px',
                } as React.CSSProperties}
                onMouseOver={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.backgroundColor = current.primaryHover;
                  }
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = current.primary;
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}