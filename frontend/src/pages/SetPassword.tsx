import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useSetPassword } from '../hooks/useAuth';

export default function SetPassword() {
  const setPasswordMutation = useSetPassword();
  const { addToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: '1 uppercase', valid: /[A-Z]/.test(password) },
    { label: '1 number', valid: /[0-9]/.test(password) },
    { label: '1 special char', valid: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password) },
  ];

  const allValid = passwordChecks.every((c) => c.valid);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid || !passwordsMatch) return;
    try {
      await setPasswordMutation.mutateAsync(password);
      addToast('success', 'Password set successfully!');
    } catch (err: any) {
      addToast('error', err?.response?.data?.error || 'Failed to set password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--fg)' }}>Set your password</h1>
          <p className="text-sm" style={{ color: 'var(--fg-dim)' }}>
            Create a password for your Stashlog account to enable email login
          </p>
        </div>

        <div className="p-8 rounded-card border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--line)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] p-1 rounded-full hover:bg-bg-elev transition-smooth"
                style={{ color: 'var(--fg-faint)' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Input label="Confirm Password" type="password" placeholder="••••••••"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined}
              required />

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

            <Button type="submit" className="w-full" isLoading={setPasswordMutation.isPending}
              disabled={!allValid || !passwordsMatch}>
              Set Password
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
