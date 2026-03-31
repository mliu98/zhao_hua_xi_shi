import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { getLocations } from '../../lib/locationService';
import type { Location } from '../../lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
  currentLocationId?: string | null;
}

export function LocationPickerSheet({ open, onClose, onSelect, currentLocationId }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setQuery('');
    getLocations().then(setLocations).catch(console.error).finally(() => setLoading(false));
  }, [open]);

  const filtered = query.trim()
    ? locations.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
    : locations;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'var(--paper-bg)',
              borderTop: '1px solid var(--ink-faint)',
              zIndex: 201,
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'var(--font-serif)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid var(--ink-faint)' }}>
              <span style={{ color: 'var(--ink-text)', fontSize: '0.9rem' }}>选择地点</span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 0 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ink-faint)' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索地点…"
                autoFocus
                style={{
                  width: '100%', padding: '8px 0', background: 'transparent',
                  border: 'none', borderBottom: '1px solid var(--ink-faint)',
                  color: 'var(--ink-text)', fontSize: '0.85rem',
                  fontFamily: 'var(--font-serif)', outline: 'none',
                }}
              />
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '0.8rem' }}>…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '0.8rem' }}>暂无地点</div>
              ) : (
                filtered.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => { onSelect(loc); onClose(); }}
                    style={{
                      display: 'block', width: '100%', padding: '14px 20px',
                      background: loc.id === currentLocationId ? 'var(--paper-warm)' : 'transparent',
                      border: 'none', borderBottom: '1px solid var(--ink-faint)',
                      textAlign: 'left', cursor: 'pointer',
                      color: 'var(--ink-text)', fontSize: '0.875rem',
                      fontFamily: 'var(--font-serif)',
                    }}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {loc.name}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
