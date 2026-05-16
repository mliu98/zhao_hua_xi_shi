import { Outlet, NavLink } from 'react-router';
import { motion } from 'motion/react';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-serif)' }}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="text-center px-6"
        style={{ paddingTop: '3.5rem', paddingBottom: '1.25rem', zIndex: 10 }}
      >
        <h1 style={{ color: 'var(--ink-text)', fontSize: '2.25rem', fontWeight: 400, letterSpacing: '0.06em', margin: '0 0 0.5rem', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
          朝花夕拾
        </h1>
        <p style={{ color: 'rgba(255, 248, 235, 0.78)', fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.12em', textShadow: '0 1px 8px rgba(0,0,0,0.9), 0 2px 16px rgba(0,0,0,0.7)' }}>
          DAWN BLOSSOMS PLUCKED AT DUSK
        </p>
      </motion.div>

      {/* Tab nav — glass pill */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.8 }}
        style={{ display: 'flex', justifyContent: 'center', paddingBottom: '2rem', zIndex: 10 }}
      >
        <nav className="glass-pill">
          {[
            { to: '/', label: '地图', end: true },
            { to: '/timeline', label: '时间线', end: false },
            { to: '/bookshelf', label: '书架', end: false },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `glass-tab${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </motion.div>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
