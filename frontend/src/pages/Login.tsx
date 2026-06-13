import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useLogin, useGoogleLogin } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { GOOGLE_CLIENT_ID } from '../utils/constants';

export default function Login() {
  const { isAuthenticated } = useAuthStore();
  const login = useLogin();
  const googleLogin = useGoogleLogin();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
    } catch (err: any) {
      const errData = err?.response?.data;
      if (errData?.code === 'EMAIL_NOT_VERIFIED') {
        addToast('warning', 'Please verify your email before logging in');
      } else {
        addToast('error', errData?.error || 'Login failed');
      }
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      addToast('error', 'Google login not configured');
      return;
    }

    // Use Google Identity Services
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20" style={{ backgroundColor: 'var(--bg)' }}>
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
          <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--fg)' }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'var(--fg-dim)' }}>
            Sign in to continue logging your work
          </p>
        </div>

        <div className="p-8 rounded-card border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--line)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

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

            <Button type="submit" className="w-full" isLoading={login.isPending}>
              Sign In
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--line)' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--fg-faint)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--line)' }} />
          </div>

          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={handleGoogleLogin}
            isLoading={googleLogin.isPending}
          >
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
          Don't have an account?{' '}
          <Link to="/register" className="text-accent font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
