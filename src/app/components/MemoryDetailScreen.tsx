import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { memories, locations } from '../data/memories';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export function MemoryDetailScreen() {
  const { id } = useParams();
  const memory = memories.find((m) => m.id === id);
  const location = memory ? locations.find((l) => l.id === memory.locationId) : null;
  const [imageScale, setImageScale] = useState(1);

  if (!memory || !location) {
    return <div>Memory not found</div>;
  }

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
          to={`/location/${location.id}`}
          style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }}
          className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} />
          {location.name}
        </Link>
      </div>

      {/* Memory Display */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="max-w-xl w-full"
        >
          {memory.type === 'note' || memory.type === 'photo' ? (
            <div
              className="overflow-hidden cursor-zoom-in transition-transform"
              style={{
                boxShadow: '0 4px 16px var(--paper-shadow)',
                transform: `scale(${imageScale})`,
              }}
              onClick={() => setImageScale(imageScale === 1 ? 1.5 : 1)}
            >
              <img
                src={memory.imageUrl}
                alt=""
                className="w-full"
                style={{ filter: 'contrast(0.92) saturate(0.85)' }}
              />
            </div>
          ) : (
            <div
              className="p-12 text-center"
              style={{
                background: 'var(--paper-warm)',
                boxShadow: '0 2px 8px var(--paper-shadow)',
                border: '1px solid rgba(58, 54, 50, 0.08)',
              }}
            >
              <div
                style={{
                  color: 'var(--ink-text)',
                  fontSize: '1.5rem',
                  marginBottom: '12px',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                }}
              >
                {memory.bookTitle}
              </div>
              <div
                style={{
                  color: 'var(--ink-light)',
                  fontSize: '1rem',
                  fontStyle: 'italic',
                }}
              >
                {memory.bookAuthor}
              </div>
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
        <div style={{ color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
          {memory.date}
        </div>
        <div
          style={{
            color: 'var(--ink-light)',
            fontSize: '0.875rem',
            marginTop: '4px',
          }}
        >
          {location.name}
        </div>
        {memory.type !== 'book' && memory.bookTitle && (
          <div
            style={{
              color: 'var(--ink-light)',
              fontSize: '0.8125rem',
              marginTop: '8px',
              fontStyle: 'italic',
            }}
          >
            {memory.bookTitle} · {memory.bookAuthor}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
