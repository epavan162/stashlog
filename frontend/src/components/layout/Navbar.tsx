import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X, LogOut, User, Settings, History, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuthStore();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'History', icon: History },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-2' : 'py-4'
      }`}
    >
      <div
        className={`mx-auto max-w-6xl px-4 sm:px-6 ${
          isScrolled ? 'glass rounded-2xl mx-4 border shadow-lg' : ''
        }`}
        style={isScrolled ? { borderColor: 'var(--line)' } : {}}
      >
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-amber flex items-center justify-center">
              <span className="text-white font-mono font-bold text-sm">S</span>
            </div>
            <span className="font-mono font-semibold text-lg" style={{ color: 'var(--fg)' }}>
              Stashlog
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated && navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-pill text-sm font-medium transition-smooth flex items-center gap-2 ${
                  location.pathname === link.path
                    ? 'bg-accent/10 text-accent'
                    : 'text-fg-dim hover:text-fg hover:bg-bg-elev'
                }`}
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-bg-elev transition-smooth"
              style={{ color: 'var(--fg-dim)' }}
              aria-label="Toggle theme"
            >
              <motion.div
                key={isDark ? 'moon' : 'sun'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </motion.div>
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm hover:bg-accent/20 transition-smooth"
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-card border p-2 shadow-xl z-50"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--line)',
                        }}
                      >
                        <div className="px-3 py-2 mb-1 border-b" style={{ borderColor: 'var(--line)' }}>
                          <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{user?.name}</p>
                          <p className="text-xs" style={{ color: 'var(--fg-faint)' }}>{user?.email}</p>
                        </div>
                        <Link
                          to="/settings"
                          className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-bg-elev transition-smooth"
                          style={{ color: 'var(--fg-dim)' }}
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings size={15} />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            logout.mutate();
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-bg-elev transition-smooth text-left"
                          style={{ color: 'var(--error)' }}
                        >
                          <LogOut size={15} />
                          Sign out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-full hover:bg-bg-elev transition-smooth"
              style={{ color: 'var(--fg-dim)' }}
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mx-4 mt-2 rounded-card border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--line)',
            }}
          >
            <div className="p-4 flex flex-col gap-1">
              {isAuthenticated ? (
                navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth ${
                      location.pathname === link.path
                        ? 'bg-accent/10 text-accent'
                        : 'hover:bg-bg-elev'
                    }`}
                    style={{ color: location.pathname === link.path ? undefined : 'var(--fg-dim)' }}
                  >
                    <link.icon size={18} />
                    {link.label}
                  </Link>
                ))
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-3 rounded-lg text-sm font-medium hover:bg-bg-elev transition-smooth"
                    style={{ color: 'var(--fg-dim)' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-3 rounded-lg text-sm font-medium bg-accent text-white text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
