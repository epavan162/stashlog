import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PenLine, Sparkles, Mail, Calendar, Flame, Bell, Clock, Send, Zap, Terminal } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    { icon: PenLine, title: 'Daily Log', desc: 'Log bugs, features, reviews, blockers, and learnings with tags.', color: 'var(--accent)' },
    { icon: Sparkles, title: 'AI Standup', desc: 'Gemini formats your log into a standup summary at 12 AM.', color: 'var(--accent-purple)' },
    { icon: Mail, title: 'Morning Email', desc: 'Receive at 8 AM. Copy-paste directly to Slack, Teams, or daily standups.', color: 'var(--accent-teal)' },
    { icon: Calendar, title: 'Weekly Digest', desc: 'Saturday 8 AM review of your entire week.', color: 'var(--accent-amber)' },
    { icon: Flame, title: 'Streak Tracking', desc: 'Build consistency with daily logging streaks.', color: 'var(--accent-pink)' },
    { icon: Bell, title: 'Smart Nudge', desc: '8 PM reminder if you forgot to log today.', color: 'var(--accent-emerald)' },
  ];

  const steps = [
    { icon: PenLine, title: 'Log your work', desc: 'Quick textarea with tags. Bug, feature, review, blocked, learning.' },
    { icon: Sparkles, title: 'AI formats it', desc: 'Gemini generates your standup at 12 AM automatically.' },
    { icon: Send, title: 'Email arrives', desc: '8 AM delivery. Perfect for daily standups, Slack, or Teams updates.' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        {/* Gradient Blobs */}
        <div className="gradient-blob gradient-blob-1" />
        <div className="gradient-blob gradient-blob-2" />
        <div className="gradient-blob gradient-blob-3" />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-pill border mb-8"
            style={{ borderColor: 'var(--line-strong)', backgroundColor: 'var(--bg-card)' }}>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
            <span className="text-xs font-medium" style={{ color: 'var(--fg-dim)' }}>
              Built for developers
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-serif italic leading-tight mb-6"
            style={{ color: 'var(--fg)' }}
          >
            Your daily work.{' '}
            <span className="text-accent">Remembered.</span>{' '}
            <br className="hidden sm:block" />
            Standup-ready.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--fg-dim)' }}
          >
            Log what you did in 2 minutes. Wake up to an AI-formatted standup summary
            in your inbox every morning. Never struggle in standup again.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/register')} className="gap-2 text-base">
              Get Started Free <ArrowRight size={18} />
            </Button>
            <Button variant="ghost" size="lg" onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See how it works
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y" style={{ borderColor: 'var(--line)' }}>
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '2 min', label: 'to log daily work' },
            { value: '8 AM', label: 'standup email delivered' },
            { value: '100%', label: 'free to use' },
            { value: '0', label: 'standups missed' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl font-bold font-mono mb-1" style={{ color: 'var(--accent)' }}>
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: 'var(--fg-faint)' }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-serif italic mb-4" style={{ color: 'var(--fg)' }}>
              Everything you need
            </h2>
            <p className="text-lg" style={{ color: 'var(--fg-dim)' }}>
              From logging to standup — fully automated
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card hover className="h-full">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                  >
                    <feature.icon size={20} />
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--fg)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-dim)' }}>
                    {feature.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 border-t" style={{ borderColor: 'var(--line)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-serif italic mb-4" style={{ color: 'var(--fg)' }}>
              How it works
            </h2>
            <p className="text-lg" style={{ color: 'var(--fg-dim)' }}>
              Three steps. Zero friction.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center border"
                  style={{ borderColor: 'var(--line-strong)', backgroundColor: 'var(--bg-card)' }}>
                  <step.icon size={24} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="font-mono text-xs mb-2" style={{ color: 'var(--accent)' }}>
                  Step {i + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--fg)' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-dim)' }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--line)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Zap size={32} className="mx-auto mb-6" style={{ color: 'var(--accent-amber)' }} />
            <blockquote
              className="text-2xl sm:text-3xl font-serif italic leading-relaxed mb-6"
              style={{ color: 'var(--fg)' }}
            >
              "I used to spend 10 minutes before standup trying to remember what I did yesterday.
              Now I spend 2 minutes logging and the rest is automatic."
            </blockquote>
            <p className="text-sm font-medium" style={{ color: 'var(--fg-dim)' }}>
              — Every developer who's ever been in a standup
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--line)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-serif italic mb-4" style={{ color: 'var(--fg)' }}>
            Ready to never forget your standup again?
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--fg-dim)' }}>
            Free forever. No credit card needed.
          </p>
          <Button size="lg" onClick={() => navigate('/register')} className="gap-2 text-base">
            Get Started Free <ArrowRight size={18} />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t py-20 px-6 overflow-hidden" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg)' }}>
        {/* Futuristic Grid Lines Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Soft Radial Ambient Lights */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-80 h-80 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center space-y-12">
          
          {/* Centered Showcase Card: Glass Dock */}
          <div className="w-full max-w-3xl rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group hover:border-accent/30 transition-all duration-500"
            style={{ 
              borderColor: 'var(--line-strong)', 
              backgroundColor: 'var(--bg-elev)',
            }}
          >
            {/* Glowing border outline effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/10 to-accent-amber/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Left: Brand Identity & Status */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-amber flex items-center justify-center shadow-lg shadow-accent/15">
                  <span className="text-white font-mono font-bold text-xs">S</span>
                </div>
                <span className="font-mono text-base font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Stashlog</span>
              </div>
              <p className="text-xs max-w-sm leading-relaxed" style={{ color: 'var(--fg-dim)' }}>
                Log what you did in 2 minutes. Wake up to an AI-formatted standup summary in your inbox every morning. Never struggle in standup again.
              </p>
            </div>

            {/* Right: Portfolio Showcase (High Focus) */}
            <a
              href="https://edagottu-pavan-kalyan-portfolio.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 flex items-center gap-3 px-5 py-3 rounded-xl border bg-[var(--bg-card)] hover:border-accent transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer shrink-0"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-accent-pink flex items-center justify-center shadow-sm">
                <Terminal size={14} className="text-white" />
              </div>
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-widest font-extrabold" style={{ color: 'var(--fg-faint)' }}>Designed & Engineered By</div>
                <div className="text-sm font-extrabold text-accent hover:text-accent-amber transition-smooth">
                  Pavan Kalyan Edagottu <span className="inline-block transition-transform duration-300 hover:translate-x-1">→</span>
                </div>
              </div>
            </a>
          </div>

          {/* Quick Nav & Details Row */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t text-sm font-medium" style={{ borderColor: 'var(--line)', color: 'var(--fg-faint)' }}>
            
            {/* Left/Top links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <a href="#how-it-works" onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }} className="hover:text-accent transition-smooth">
                How It Works
              </a>
              <a href="/login" className="hover:text-accent transition-smooth">
                Sign In
              </a>
              <a href="/register" className="hover:text-accent transition-smooth">
                Create Account
              </a>
              <a 
                href="https://github.com/epavan162/stashlog" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-accent transition-smooth"
              >
                Source Code
              </a>
            </div>

            {/* Right/Bottom metadata */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border bg-[var(--bg-elev)] border-[var(--line-strong)] font-mono text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                <span style={{ color: 'var(--fg-dim)' }}>All Systems Operational</span>
              </div>
              <p>© {new Date().getFullYear()} Stashlog. Open-source under MIT License.</p>
            </div>
          </div>

        </div>
      </footer>

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}
