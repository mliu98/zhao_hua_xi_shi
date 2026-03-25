import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMemoryById } from '../../lib/memoryService';
import type { Memory } from '../../lib/types';

function ImageGallery({ urls, border }: { urls: string[]; border?: string }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (urls.length === 0) return null;

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <div
          className="overflow-hidden cursor-zoom-in"
          style={{
            boxShadow: '0 4px 16px var(--paper-shadow)',
            border: border ?? 'none',
            transform: zoomed ? 'scale(1.5)' : 'scale(1)',
            transition: 'transform 0.4s ease',
          }}
          onClick={() => setZoomed(!zoomed)}
        >
          <img
            src={urls[index]}
            alt=""
            className="w-full"
            style={{ display: 'block', filter: 'contrast(0.92) saturate(0.85)' }}
          />
        </div>

        {urls.length > 1 && !zoomed && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + urls.length) % urls.length); }}
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(58,54,50,0.45)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              <ChevronLeft size={16} color="white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % urls.length); }}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(58,54,50,0.45)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              <ChevronRight size={16} color="white" />
            </button>
          </>
        )}
      </div>

      {urls.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{ width: '6px', height: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: i === index ? 'var(--ink-light)' : 'var(--ink-faint)', opacity: i === index ? 1 : 0.4 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MemoryDetailScreen() {
  const { id } = useParams();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);

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
          {/* Photo */}
          {memory.type === 'photo' && memory.photo && (
            <ImageGallery urls={memory.photo.images.map((i) => i.image_url)} />
          )}

          {/* Note: handwritten */}
          {memory.type === 'note' && memory.note?.note_type === 'handwritten' && memory.note.images.length > 0 && (
            <div>
              <ImageGallery urls={memory.note.images.map((i) => i.image_url)} border="4px solid var(--paper-warm)" />
              {memory.note.content && (
                <p style={{ color: 'var(--ink-light)', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center', fontStyle: 'italic' }}>
                  {memory.note.content}
                </p>
              )}
            </div>
          )}

          {/* Note: text */}
          {memory.type === 'note' && memory.note?.note_type === 'text' && (
            <div style={{ padding: '40px', background: 'var(--paper-warm)', boxShadow: '0 4px 16px var(--paper-shadow)', border: '1px solid rgba(58,54,50,0.08)' }}>
              <p style={{ color: 'var(--ink-text)', fontSize: '1rem', lineHeight: '2', margin: 0, whiteSpace: 'pre-wrap' }}>
                {memory.note.content}
              </p>
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
          <p style={{ color: 'var(--ink-text)', fontSize: '0.9rem', marginBottom: '8px' }}>{memory.photo.caption}</p>
        )}
        <div style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>{memory.date}</div>
        {locationName && (
          <div style={{ color: 'var(--ink-light)', fontSize: '0.8rem', marginTop: '4px' }}>{locationName}</div>
        )}
      </motion.div>
    </motion.div>
  );
}
