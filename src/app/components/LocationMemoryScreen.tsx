import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { getLocations } from '../../lib/locationService';
import { getMemoryLayout } from '../../lib/pseudoRandom';
import type { Location, Memory } from '../../lib/types';

export function LocationMemoryScreen() {
  const { id } = useParams();
  const [location, setLocation] = useState<Location | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
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

      {/* Memory space */}
      <div className="max-w-4xl mx-auto relative" style={{ minHeight: '500px' }}>
        {memories.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', textAlign: 'center', marginTop: '80px' }}
          >
            还没有记忆
          </motion.p>
        ) : (
          memories.map((memory, index) => {
            const { x, y, rotation } = getMemoryLayout(memory.id);
            return (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `rotate(${rotation}deg)` }}
              >
                <Link to={`/memory/${memory.id}`} className="block hover:scale-105 transition-transform" />
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add memory */}
      <div className="max-w-4xl mx-auto pb-8 text-center">
        <Link
          to={`/add?locationId=${id}`}
          style={{ color: 'var(--ink-light)', fontSize: '0.875rem', textDecoration: 'none', borderBottom: '1px solid var(--ink-faint)', paddingBottom: '2px' }}
          className="hover:opacity-70 transition-opacity"
        >
          + 添加記憶
        </Link>
      </div>
    </motion.div>
  );
}
