import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useLogin, useGoogleLogin } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { GOOGLE_CLIENT_ID } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';

export default function Login() {
  const { isAuthenticated } = useAuthStore();
  const login = useLogin();
  const googleLogin = useGoogleLogin();
  const { addToast } = useToast();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

          <div className="w-full flex justify-center min-h-[44px]">
            <div id="google-login-btn" className="w-full"></div>
          </div>
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
