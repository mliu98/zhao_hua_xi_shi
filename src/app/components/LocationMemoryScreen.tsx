import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { getLocationById } from '../../lib/locationService';
import { getMemoriesByLocation } from '../../lib/memoryService';
import type { Location, Memory } from '../../lib/types';

function MemoryCard({ memory, index }: { memory: Memory; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05, duration: 0.5 }}
      style={{ breakInside: 'avoid', marginBottom: '16px' }}
    >
      <Link to={`/memory/${memory.id}`} style={{ textDecoration: 'none', display: 'block' }} className="hover:opacity-80 transition-opacity">

        {/* Photo */}
        {memory.type === 'photo' && memory.photo && memory.photo.images.length > 0 && (
          <div>
            <img
              src={memory.photo.images[0].image_url}
              alt=""
              style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', filter: 'contrast(0.92) saturate(0.85)', boxShadow: '0 2px 8px var(--paper-shadow)' }}
            />
            {(memory.photo.caption || memory.photo.images.length > 1) && (
              <div style={{ padding: '8px 4px 0' }}>
                {memory.photo.caption && (
                  <p style={{ color: 'var(--ink-text)', fontSize: '0.8rem', margin: '0 0 2px', lineHeight: 1.5 }}>{memory.photo.caption}</p>
                )}
                {memory.photo.images.length > 1 && (
                  <span style={{ color: 'var(--ink-faint)', fontSize: '0.72rem' }}>{memory.photo.images.length} 张</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Note: handwritten */}
        {memory.type === 'note' && memory.note?.note_type === 'handwritten' && memory.note.images.length > 0 && (
          <div>
            <img
              src={memory.note.images[0].image_url}
              alt=""
              style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', filter: 'contrast(0.92) saturate(0.85)', boxShadow: '0 2px 8px var(--paper-shadow)', border: '3px solid var(--paper-warm)' }}
            />
            {memory.note.content && (
              <p style={{ color: 'var(--ink-light)', fontSize: '0.78rem', margin: '8px 4px 0', fontStyle: 'italic', lineHeight: 1.6 }}>
                {memory.note.content}
              </p>
            )}
          </div>
        )}

        {/* Note: text */}
        {memory.type === 'note' && memory.note?.note_type === 'text' && (
          <div style={{ padding: '16px', background: 'var(--paper-warm)', boxShadow: '0 2px 8px var(--paper-shadow)', border: '1px solid rgba(58,54,50,0.08)' }}>
            <p style={{ color: 'var(--ink-text)', fontSize: '0.82rem', lineHeight: 1.8, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical' }}>
              {memory.note.content}
            </p>
          </div>
        )}

        {/* Book */}
        {memory.type === 'book' && memory.book && (
          <div style={{ background: 'var(--paper-warm)', boxShadow: '0 2px 8px var(--paper-shadow)', border: '1px solid rgba(58,54,50,0.08)' }}>
            {memory.book.cover_url && (
              <img src={memory.book.cover_url} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', filter: 'contrast(0.92) saturate(0.85)' }} />
            )}
            <div style={{ padding: '12px 14px' }}>
              <p style={{ color: 'var(--ink-text)', fontSize: '0.85rem', margin: '0 0 2px', fontWeight: 500 }}>{memory.book.title}</p>
              {memory.book.author && (
                <p style={{ color: 'var(--ink-light)', fontSize: '0.75rem', margin: '0 0 8px' }}>{memory.book.author}</p>
              )}
              {memory.book.reading_notes && (
                <p style={{ color: 'var(--ink-light)', fontSize: '0.78rem', lineHeight: 1.7, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {memory.book.reading_notes}
                </p>
              )}
              {!memory.book.reading_notes && memory.book.quotes?.[0] && (
                <p style={{ color: 'var(--ink-faint)', fontSize: '0.78rem', lineHeight: 1.7, margin: 0, fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {memory.book.quotes[0].content}
                </p>
              )}
            </div>
          </div>
        )}

        <div style={{ color: 'var(--ink-faint)', fontSize: '0.7rem', marginTop: '5px', paddingLeft: '2px' }}>
          {memory.date}
        </div>
      </Link>
    </motion.div>
  );
}

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
    return <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>…</div>;
  }

  if (!location) {
    return <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>找不到这个地点</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="min-h-screen p-6" style={{ fontFamily: 'var(--font-serif)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
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

        {/* Masonry */}
        {memories.length === 0 ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', textAlign: 'center', marginTop: '80px' }}>
            还没有记忆
          </motion.p>
        ) : (
          <div style={{ columns: '3 160px', columnGap: '16px' }}>
            {memories.map((memory, index) => (
              <MemoryCard key={memory.id} memory={memory} index={index} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
