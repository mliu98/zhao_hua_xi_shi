import { Outlet, NavLink } from 'react-router';
import { motion } from 'motion/react';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-serif)' }}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center py-8 px-6"
      >
        <h1 className="mb-2" style={{ color: 'var(--ink-text)', fontSize: '1.75rem', fontWeight: 400, letterSpacing: '0.02em' }}>
          朝花夕拾
        </h1>
        <p style={{ color: 'var(--ink-light)', fontSize: '0.875rem', fontWeight: 400 }}>
          Dawn Blossoms Plucked at Dusk
        </p>
      </motion.div>

      {/* Tab nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '8px' }}
      >
        {[{ to: '/', label: '地图', end: true }, { to: '/timeline', label: '时间线', end: false }].map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              color: isActive ? 'var(--ink-text)' : 'var(--ink-faint)',
              fontSize: '0.875rem',
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
