'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { FaArrowLeft } from 'react-icons/fa';
import { LogoIcon } from '@/lib/icons';

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-md rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg dark:shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {error && (
          <div className="w-full px-6 pt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-3 text-center">
            {error}
          </div>
        )}

        {mode === 'login' && (
          <div className="flex flex-col p-6 gap-4">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Log in to SmartSpecs</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />

              <button
                type="button"
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline text-left mt-1"
                onClick={() => setMode('forgot')}
                disabled={loading}
              >
                Forgot password?
              </button>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-3 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400">or</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all flex items-center justify-center gap-2"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              disabled={loading}
            >
              <FcGoogle size={18} />
              Continue with Google
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              Don't have an account?{' '}
              <button 
                type="button" 
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {mode === 'signup' && (
          <div className="flex flex-col p-6 gap-4">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Get started with SmartSpecs</p>
            </div>

            <form onSubmit={handleSignup} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400">or</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all flex items-center justify-center gap-2"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              disabled={loading}
            >
              <FcGoogle size={18} />
              Continue with Google
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              Already have an account?{' '}
              <button 
                type="button" 
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="flex flex-col p-6 gap-4">
            <button
              type="button"
              onClick={() => setMode('login')}
              className="self-start flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline text-sm font-medium mb-2"
            >
              <FaArrowLeft size={14} /> Back
            </button>

            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password?</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">We'll send you an OTP to reset it</p>
            </div>

            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </div>
        )}

        {mode === 'forgot-otp' && (
          <div className="flex flex-col p-6 gap-4">
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="self-start flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline text-sm font-medium mb-2"
            >
              <FaArrowLeft size={14} /> Back
            </button>

            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify OTP</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Enter the code sent to {email}</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
              <div className="flex justify-center gap-2">
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
                    className="w-12 h-12 text-center text-xl font-medium border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ))}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          </div>
        )}

        {mode === 'forgot-reset' && (
          <div className="flex flex-col p-6 gap-4">
            <button
              type="button"
              onClick={() => setMode('forgot-otp')}
              className="self-start flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline text-sm font-medium mb-2"
            >
              <FaArrowLeft size={14} /> Back
            </button>

            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create new password</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Enter a strong password (minimum 8 characters)</p>
            </div>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium transition-all disabled:opacity-50"
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