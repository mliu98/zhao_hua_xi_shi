import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { getLocationById } from '../../lib/locationService';
import { getMemoriesByLocation } from '../../lib/memoryService';
import { getMemoryLayout } from '../../lib/pseudoRandom';
import { StackedImages } from './StackedImages';
import type { Location, Memory } from '../../lib/types';

export function LocationMemoryScreen() {
  const { id } = useParams();
  const [location, setLocation] = useState<Location | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocationById(id!)
      .then(setLocation)
      .catch(console.error)
      .finally(() => setLoading(false));

    getMemoriesByLocation(id!)
      .then(setMemories)
      .catch(console.error);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>…</div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>找不到这个地点</div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="min-h-screen p-6" style={{ fontFamily: 'var(--font-serif)' }}>
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <Link to="/" style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }} className="inline-flex items-center gap-2 mb-6 hover:opacity-70 transition-opacity">
          <ArrowLeft size={16} /> 返回
        </Link>
        <div className="flex items-baseline justify-between">
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} style={{ color: 'var(--ink-text)', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.02em' }}>
            {location.name}
          </motion.h2>
          <Link to={`/add?locationId=${id}`} style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', textDecoration: 'none' }} className="hover:opacity-70 transition-opacity">
            + 添加
          </Link>
        </div>
      </div>

      {/* Memory space */}
      <div className="max-w-4xl mx-auto relative" style={{ minHeight: '500px' }}>
        {memories.length === 0 ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', textAlign: 'center', marginTop: '80px' }}>
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
                <Link to={`/memory/${memory.id}`} className="block hover:scale-105 transition-transform">
                  {/* Photo */}
                  {memory.type === 'photo' && memory.photo && (
                    memory.photo.images.length > 1
                      ? <StackedImages urls={memory.photo.images.map(i => i.image_url)} />
                      : <div style={{ width: '160px', overflow: 'hidden', boxShadow: '0 2px 8px var(--paper-shadow)' }}>
                          <img src={memory.photo.images[0]?.image_url} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', filter: 'contrast(0.92) saturate(0.85)' }} />
                        </div>
                  )}

                  {/* Note: handwritten */}
                  {memory.type === 'note' && memory.note?.note_type === 'handwritten' && memory.note.images.length > 0 && (
                    memory.note.images.length > 1
                      ? <StackedImages urls={memory.note.images.map(i => i.image_url)} />
                      : <div style={{ width: '160px', overflow: 'hidden', boxShadow: '0 2px 8px var(--paper-shadow)', border: '3px solid var(--paper-warm)' }}>
                          <img src={memory.note.images[0].image_url} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', filter: 'contrast(0.92) saturate(0.85)' }} />
                        </div>
                  )}

                  {/* Note: text */}
                  {memory.type === 'note' && memory.note?.note_type === 'text' && (
                    <div style={{ width: '160px', minHeight: '120px', padding: '14px', background: 'var(--paper-warm)', boxShadow: '0 2px 8px var(--paper-shadow)', border: '1px solid rgba(58,54,50,0.08)' }}>
                      <p style={{ color: 'var(--ink-text)', fontSize: '0.78rem', lineHeight: '1.7', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' }}>
                        {memory.note.content}
                      </p>
                    </div>
                  )}

                  {/* Book */}
                  {memory.type === 'book' && memory.book && (
                    memory.book.cover_url
                      ? <div style={{ width: '110px', overflow: 'hidden', boxShadow: '0 2px 8px var(--paper-shadow)' }}>
                          <img src={memory.book.cover_url} alt="" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block', filter: 'contrast(0.92) saturate(0.85)' }} />
                        </div>
                      : <div style={{ width: '110px', height: '150px', padding: '12px', background: 'var(--paper-warm)', boxShadow: '0 2px 8px var(--paper-shadow)', border: '1px solid rgba(58,54,50,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <p style={{ color: 'var(--ink-text)', fontSize: '0.78rem', lineHeight: '1.5', margin: 0 }}>{memory.book.title}</p>
                          {memory.book.author && <p style={{ color: 'var(--ink-light)', fontSize: '0.7rem', marginTop: '6px', margin: '6px 0 0' }}>{memory.book.author}</p>}
                        </div>
                  )}

                  <div style={{ color: 'var(--ink-faint)', fontSize: '0.7rem', marginTop: '6px', transform: `rotate(-${rotation}deg)` }}>
                    {memory.date}
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
