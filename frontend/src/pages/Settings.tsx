import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Shield, Mail, GitBranch, AlertTriangle, Trash2, LogOut, Monitor, Eye, EyeOff, Check, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';
import { TIMEZONE_OPTIONS, STALE_TIME } from '../utils/constants';
import api from '../services/api';
import { authService } from '../services/auth.service';
import type { Session } from '../types';

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const logout = useLogout();

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');

  // Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/users/me/sessions').then((r) => r.data),
    staleTime: STALE_TIME,
  });

  // Email preferences
  const [dailyEmail, setDailyEmail] = useState(user?.daily_email_enabled ?? true);
  const [weeklyEmail, setWeeklyEmail] = useState(user?.weekly_email_enabled ?? true);
  const [nudgeEmail, setNudgeEmail] = useState(user?.nudge_email_enabled ?? true);

  const updateProfile = useMutation({
    mutationFn: () => api.put('/users/me', { name, timezone }),
    onSuccess: (res) => {
      setUser(res.data.user);
      addToast('success', 'Profile updated');
    },
    onError: () => addToast('error', 'Failed to update profile'),
  });

  const changePassword = useMutation({
    mutationFn: () => api.put('/users/me/password', { old_password: oldPassword, new_password: newPassword }),
    onSuccess: () => {
      addToast('success', 'Password changed');
      setOldPassword('');
      setNewPassword('');
    },
    onError: (err: any) => addToast('error', err?.response?.data?.error || 'Failed to change password'),
  });

  const updatePreferences = useMutation({
    mutationFn: () => api.put('/users/me/preferences', {
      daily_email_enabled: dailyEmail,
      weekly_email_enabled: weeklyEmail,
      nudge_email_enabled: nudgeEmail,
    }),
    onSuccess: (res) => {
      setUser(res.data.user);
      addToast('success', 'Preferences updated');
    },
  });

  const deleteAccount = useMutation({
    mutationFn: () => api.delete('/users/me'),
    onSuccess: () => {
      addToast('info', 'Account scheduled for deletion');
      logout.mutate();
    },
  });

  const logoutAll = useMutation({
    mutationFn: () => authService.logoutAll(),
    onSuccess: () => {
      addToast('success', 'Logged out from all devices');
      logout.mutate();
    },
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) => api.delete(`/users/me/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addToast('success', 'Session terminated');
    },
  });

  const passwordChecks = [
    { label: '8+ characters', valid: newPassword.length >= 8 },
    { label: '1 uppercase', valid: /[A-Z]/.test(newPassword) },
    { label: '1 number', valid: /[0-9]/.test(newPassword) },
    { label: '1 special char', valid: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(newPassword) },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--fg)' }}>Settings</h1>

          {/* Profile */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <User size={20} style={{ color: 'var(--accent)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Profile</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--fg)' }}>{user?.name}</p>
                  <p className="text-sm" style={{ color: 'var(--fg-faint)' }}>{user?.email}</p>
                </div>
              </div>
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--fg-dim)' }}>Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-11 px-4 rounded-input text-sm border outline-none transition-smooth"
                  style={{ backgroundColor: 'var(--bg-elev)', color: 'var(--fg)', borderColor: 'var(--line-strong)' }}
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <Button onClick={() => updateProfile.mutate()} isLoading={updateProfile.isPending}>Save Changes</Button>
            </div>
          </Card>

          {/* Security */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Shield size={20} style={{ color: 'var(--accent-teal)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Security</h2>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-dim)' }}>Change Password</h3>
              <div className="relative">
                <Input label="Current Password" type={showOldPw ? 'text' : 'password'} value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)} />
                <button type="button" onClick={() => setShowOldPw(!showOldPw)}
                  className="absolute right-3 top-[38px] p-1" style={{ color: 'var(--fg-faint)' }}>
                  {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <Input label="New Password" type={showNewPw ? 'text' : 'password'} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-[38px] p-1" style={{ color: 'var(--fg-faint)' }}>
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {passwordChecks.map((c) => (
                    <div key={c.label} className="flex items-center gap-1.5 text-xs"
                      style={{ color: c.valid ? 'var(--success)' : 'var(--fg-faint)' }}>
                      {c.valid ? <Check size={12} /> : <X size={12} />}
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => changePassword.mutate()} isLoading={changePassword.isPending}
                disabled={!passwordChecks.every((c) => c.valid)}>
                Update Password
              </Button>
            </div>

            <div className="border-t pt-6" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-dim)' }}>Active Sessions</h3>
                <Button variant="ghost" size="sm" onClick={() => logoutAll.mutate()} className="text-error gap-1.5">
                  <LogOut size={14} /> Logout All
                </Button>
              </div>
              <div className="space-y-3">
                {sessionsData?.sessions?.map((session: Session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg-elev)' }}>
                    <div className="flex items-center gap-3">
                      <Monitor size={16} style={{ color: 'var(--fg-faint)' }} />
                      <div>
                        <p className="text-xs font-mono" style={{ color: 'var(--fg-dim)' }}>
                          {session.device_info?.substring(0, 50) || 'Unknown device'}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--fg-faint)' }}>{session.ip_address}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteSession.mutate(session.id)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Email Preferences */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Mail size={20} style={{ color: 'var(--accent-purple)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Email Preferences</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Daily standup emails (8 AM)', desc: 'Receive your AI-generated standup summary', value: dailyEmail, setter: setDailyEmail },
                { label: 'Weekly digest (Saturday 8 AM)', desc: 'Weekly recap of your work', value: weeklyEmail, setter: setWeeklyEmail },
                { label: 'Nudge reminders (8 PM)', desc: 'Reminder if you haven\'t logged today', value: nudgeEmail, setter: setNudgeEmail },
              ].map((pref) => (
                <label key={pref.label} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer"
                  style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg-elev)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{pref.label}</p>
                    <p className="text-xs" style={{ color: 'var(--fg-faint)' }}>{pref.desc}</p>
                  </div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${pref.value ? 'bg-accent' : 'bg-line-strong'}`}
                    onClick={() => pref.setter(!pref.value)}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${pref.value ? 'translate-x-5' : ''}`} />
                  </div>
                </label>
              ))}
              <Button onClick={() => updatePreferences.mutate()} isLoading={updatePreferences.isPending}>
                Save Preferences
              </Button>
            </div>
          </Card>

          {/* Git Integration (Coming Soon) */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <GitBranch size={20} style={{ color: 'var(--fg-faint)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--fg-faint)' }}>Git Integration</h2>
              <span className="px-2 py-0.5 rounded-pill text-[10px] font-mono bg-accent/10 text-accent">Coming Soon</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--fg-faint)' }}>
              Auto-import commits from GitHub, GitLab, or Bitbucket into your daily logs.
            </p>
            <div className="flex gap-4 mt-4 opacity-30">
              <div className="w-10 h-10 rounded-lg bg-bg-elev flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              </div>
              <div className="w-10 h-10 rounded-lg bg-bg-elev flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M4.845.904c-.435 0-.82.205-1.055.53L.36 6.78c-.47.696-.275 1.64.44 2.08l10.46 6.48c.6.37 1.355.37 1.955 0L23.2 8.86c.715-.44.91-1.384.44-2.08L20.21 1.434c-.235-.325-.62-.53-1.055-.53zm6.405 12.835L5.11 9.84l6.14-1.6 6.14 1.6z"/></svg>
              </div>
              <div className="w-10 h-10 rounded-lg bg-bg-elev flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"/></svg>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border-error/20">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-error" />
              <h2 className="text-lg font-semibold text-error">Danger Zone</h2>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--fg-dim)' }}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)} className="gap-2">
              <Trash2 size={16} /> Delete Account
            </Button>
          </Card>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account" size="sm">
        <p className="text-sm mb-4" style={{ color: 'var(--fg-dim)' }}>
          This will permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.
        </p>
        <Input placeholder="Type DELETE" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={() => deleteAccount.mutate()} disabled={deleteConfirm !== 'DELETE'}
            isLoading={deleteAccount.isPending} className="flex-1">
            Delete Forever
          </Button>
        </div>
      </Modal>
    </div>
  );
}
