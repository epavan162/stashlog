import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useRegister, useGoogleLogin } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { GOOGLE_CLIENT_ID } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';

export default function Register() {
  const { isAuthenticated } = useAuthStore();
  const register = useRegister();
  const googleLogin = useGoogleLogin();
  const { addToast } = useToast();
  const { isDark } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const initializeGoogle = () => {
      const google = (window as any).google;
      if (google?.accounts?.id && GOOGLE_CLIENT_ID) {
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

        const btnEl = document.getElementById('google-login-btn');
        if (btnEl) {
          google.accounts.id.renderButton(btnEl, {
            theme: isDark ? 'filled_black' : 'outline',
            size: 'large',
            width: btnEl.clientWidth || 384,
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initializeGoogle();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [googleLogin, addToast, isDark]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (googleLogin.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm" style={{ color: 'var(--fg-dim)' }}>Connecting to Google...</span>
        </div>
      </div>
    );
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

          <div className="w-full flex justify-center min-h-[44px]">
            <div id="google-login-btn" className="w-full"></div>
          </div>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--fg-dim)' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
