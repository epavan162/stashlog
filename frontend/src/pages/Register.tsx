import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useRegister, useGoogleLogin } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { GOOGLE_CLIENT_ID } from '../utils/constants';

export default function Register() {
  const { isAuthenticated } = useAuthStore();
  const register = useRegister();
  const googleLogin = useGoogleLogin();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const passwordChecks = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: '1 uppercase', valid: /[A-Z]/.test(password) },
    { label: '1 number', valid: /[0-9]/.test(password) },
    { label: '1 special char', valid: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password) },
  ];

  const allValid = passwordChecks.every((c) => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) {
      addToast('warning', 'Please meet all password requirements');
      return;
    }
    try {
      await register.mutateAsync({ name, email, password });
      setRegistered(true);
      addToast('success', 'Check your email for verification link');
    } catch (err: any) {
      addToast('error', err?.response?.data?.error || 'Registration failed');
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      addToast('error', 'Google login not configured');
      return;
    }
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      addToast('error', 'Google SDK not loaded');
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          await googleLogin.mutateAsync(response.credential);
        } catch (err: any) {
          addToast('error', err?.response?.data?.error || 'Google login failed');
        }
      },
    });
    google.accounts.id.prompt();
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20" style={{ backgroundColor: 'var(--bg)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-success" />
          </div>
          <h1 className="text-2xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>Check your email</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--fg-dim)' }}>
            We sent a verification link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <Link to="/login">
            <Button variant="secondary">Back to Sign In</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-amber flex items-center justify-center">
              <span className="text-white font-mono font-bold text-lg">S</span>
            </div>
          </Link>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--fg)' }}>Create your account</h1>
          <p className="text-sm" style={{ color: 'var(--fg-dim)' }}>Start logging your work in 2 minutes</p>
        </div>

        <div className="p-8 rounded-card border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--line)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Full Name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] p-1 rounded-full hover:bg-bg-elev transition-smooth"
                style={{ color: 'var(--fg-faint)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password requirements */}
            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-1.5 text-xs"
                    style={{ color: check.valid ? 'var(--success)' : 'var(--fg-faint)' }}>
                    {check.valid ? <Check size={12} /> : <X size={12} />}
                    {check.label}
                  </div>
                ))}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={register.isPending} disabled={!allValid && password.length > 0}>
              Create Account
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--line)' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--fg-faint)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--line)' }} />
          </div>

          <Button variant="secondary" className="w-full gap-2" onClick={handleGoogleLogin} isLoading={googleLogin.isPending}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--fg-dim)' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
