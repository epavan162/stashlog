import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { authService } from '../services/auth.service';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    authService.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified! You can now log in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.error || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <Loader size={48} className="mx-auto mb-4 animate-spin text-accent" />
            <h1 className="text-xl font-semibold" style={{ color: 'var(--fg)' }}>Verifying your email...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="mx-auto mb-4 text-success" />
            <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--fg)' }}>Email Verified!</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--fg-dim)' }}>{message}</p>
            <Link to="/login"><Button>Go to Login</Button></Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto mb-4 text-error" />
            <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--fg)' }}>Verification Failed</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--fg-dim)' }}>{message}</p>
            <Link to="/login"><Button variant="secondary">Back to Login</Button></Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
