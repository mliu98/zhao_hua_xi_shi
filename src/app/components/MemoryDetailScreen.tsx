import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { getMemoryById } from '../../lib/memoryService';
import type { Memory } from '../../lib/types';

export function MemoryDetailScreen() {
  const { id } = useParams();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    getMemoryById(id!).then(setMemory).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
        …
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
        找不到这条记忆
      </div>
    );
  }

  const locationName = (memory as any).location?.name ?? '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen p-6 flex flex-col"
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      {/* Header */}
      <div className="max-w-3xl mx-auto w-full mb-8">
        <Link
          to={`/location/${memory.location_id}`}
          style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }}
          className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} />
          {locationName}
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="max-w-xl w-full"
        >
          {memory.type === 'photo' && memory.photo && (
            <div
              className="overflow-hidden cursor-zoom-in transition-transform"
              style={{
                boxShadow: '0 4px 16px var(--paper-shadow)',
                transform: zoomed ? 'scale(1.5)' : 'scale(1)',
                transition: 'transform 0.4s ease',
              }}
              onClick={() => setZoomed(!zoomed)}
            >
              <img
                src={memory.photo.image_url}
                alt={memory.photo.caption ?? ''}
                className="w-full"
                style={{ display: 'block', filter: 'contrast(0.92) saturate(0.85)' }}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="max-w-3xl mx-auto w-full mt-8 text-center"
      >
        {memory.type === 'photo' && memory.photo?.caption && (
          <p style={{ color: 'var(--ink-text)', fontSize: '0.9rem', marginBottom: '8px' }}>
            {memory.photo.caption}
          </p>
        )}
        <div style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>{memory.date}</div>
        {locationName && (
          <div style={{ color: 'var(--ink-light)', fontSize: '0.8rem', marginTop: '4px' }}>{locationName}</div>
        )}
      </motion.div>
    </motion.div>
  );
}
