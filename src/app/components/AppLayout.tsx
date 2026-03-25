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
        style={{ paddingTop: '3.5rem', paddingBottom: '1.25rem' }}
      >
        <h1 style={{ color: 'var(--ink-text)', fontSize: '2.25rem', fontWeight: 400, letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>
          朝花夕拾
        </h1>
        <p style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.12em' }}>
          DAWN BLOSSOMS PLUCKED AT DUSK
        </p>
      </motion.div>

      {/* Tab nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.8 }}
        style={{ display: 'flex', justifyContent: 'center', gap: '40px', paddingBottom: '2rem' }}
      >
        {[{ to: '/', label: '地图', end: true }, { to: '/timeline', label: '时间线', end: false }].map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              color: isActive ? 'var(--ink-text)' : 'var(--ink-faint)',
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              paddingBottom: '4px',
              borderBottom: isActive ? '1px solid var(--ink-text)' : 'none',
              fontFamily: 'var(--font-serif)',
            })}
          >
            {label}
          </NavLink>
        ))}
      </motion.div>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
