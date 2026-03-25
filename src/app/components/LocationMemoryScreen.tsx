import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { getLocations } from '../../lib/locationService';
import type { Location } from '../../lib/types';

export function LocationMemoryScreen() {
  const { id } = useParams();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocations()
      .then((all) => setLocation(all.find((l) => l.id === id) ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
        …
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
        找不到这个地点
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen p-6"
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <Link
          to="/"
          style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }}
          className="inline-flex items-center gap-2 mb-6 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} />
          返回
        </Link>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          style={{ color: 'var(--ink-text)', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.02em' }}
        >
          {location.name}
        </motion.h2>
      </div>

      {/* Memory space — will be populated in Phase 2+ */}
      <div className="max-w-4xl mx-auto relative" style={{ minHeight: '400px' }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', textAlign: 'center', marginTop: '80px' }}
        >
          还没有记忆
        </motion.p>
      </div>
    </motion.div>
  );
}
