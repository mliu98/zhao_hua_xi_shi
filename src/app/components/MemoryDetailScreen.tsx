import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMemoryById, deleteMemory } from '../../lib/memoryService';
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
  const navigate = useNavigate();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!confirm('确定要删除这条记忆吗？')) return;
    setDeleting(true);
    try {
      await deleteMemory(memory!.id);
      navigate(memory!.location_id ? `/location/${memory!.location_id}` : '/');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
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
      <div className="max-w-3xl mx-auto w-full mb-8 flex items-center justify-between">
        <Link
          to={`/location/${memory.location_id}`}
          style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }}
          className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} />
          {locationName}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to={`/memory/${memory.id}/edit`}
            style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', textDecoration: 'none' }}
            className="hover:opacity-70 transition-opacity"
          >
            编辑
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ background: 'none', border: 'none', cursor: deleting ? 'default' : 'pointer', color: 'var(--ink-faint)', fontSize: '0.8rem', fontFamily: 'var(--font-serif)', opacity: deleting ? 0.5 : 1, padding: 0 }}
            className="hover:opacity-70 transition-opacity"
          >
            {deleting ? '删除中…' : '删除'}
          </button>
        </div>
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

          {/* Book */}
          {memory.type === 'book' && memory.book && (
            <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
              {memory.book.cover_url && (
                <img src={memory.book.cover_url} alt="" style={{ width: '120px', flexShrink: 0, boxShadow: '0 4px 16px var(--paper-shadow)', display: 'block' }} />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'var(--ink-text)', fontSize: '1.2rem', fontWeight: 400, margin: '0 0 6px', lineHeight: 1.4 }}>{memory.book.title}</h3>
                {memory.book.author && (
                  <p style={{ color: 'var(--ink-light)', fontSize: '0.875rem', margin: '0 0 20px' }}>{memory.book.author}</p>
                )}
                {memory.book.reading_notes && (
                  <p style={{ color: 'var(--ink-text)', fontSize: '0.9rem', lineHeight: '1.9', margin: '0 0 20px', whiteSpace: 'pre-wrap' }}>{memory.book.reading_notes}</p>
                )}
                {memory.book.quotes && memory.book.quotes.length > 0 && (
                  <div style={{ borderLeft: '2px solid var(--ink-faint)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {memory.book.quotes.map((q) => (
                      <p key={q.id || q.order} style={{ color: 'var(--ink-light)', fontSize: '0.875rem', lineHeight: '1.8', margin: 0, fontStyle: 'italic' }}>
                        {q.content}
                      </p>
                    ))}
                  </div>
                )}
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
