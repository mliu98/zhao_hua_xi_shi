import { useEffect, useRef, useState } from 'react';
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

function BookSpread({ urls }: { urls: string[] }) {
  const [spreadIndex, setSpreadIndex] = useState(0); // index of left-page image
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const leftRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (urls.length === 0) return null;

  const totalSpreads = Math.ceil(urls.length / 2);
  const canPrev = spreadIndex > 0;
  const canNext = spreadIndex + 2 < urls.length || (urls.length % 2 === 1 && spreadIndex + 1 < urls.length);

  const leftUrl = urls[spreadIndex] ?? null;
  const rightUrl = urls[spreadIndex + 1] ?? null;

  // Mobile: single image fallback
  if (isMobile) {
    return (
      <div>
        <div style={{ position: 'relative', boxShadow: '0 4px 16px var(--paper-shadow)', border: '4px solid var(--paper-warm)' }}>
          <img src={leftUrl} alt="" className="w-full" style={{ display: 'block', filter: 'contrast(0.92) saturate(0.85)' }} />
          {urls.length > 1 && (
            <>
              <button onClick={() => setSpreadIndex((i) => Math.max(0, i - 1))} disabled={!canPrev} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(58,54,50,0.45)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: canPrev ? 1 : 0.3 }}>
                <ChevronLeft size={16} color="white" />
              </button>
              <button onClick={() => setSpreadIndex((i) => Math.min(urls.length - 1, i + 1))} disabled={!canNext} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(58,54,50,0.45)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: canNext ? 1 : 0.3 }}>
                <ChevronRight size={16} color="white" />
              </button>
            </>
          )}
        </div>
        {urls.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
            {urls.map((_, i) => (
              <button key={i} onClick={() => setSpreadIndex(i)} style={{ width: '6px', height: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: i === spreadIndex ? 'var(--ink-light)' : 'var(--ink-faint)', opacity: i === spreadIndex ? 1 : 0.4 }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: double-page spread
  return (
    <div>
      <div style={{ boxShadow: '0 4px 24px var(--paper-shadow)', border: '4px solid var(--paper-warm)', display: 'grid', gridTemplateColumns: '1fr 6px 1fr', alignItems: 'stretch' }}>
        {/* Left page */}
        <img ref={leftRef} src={leftUrl} alt="" style={{ display: 'block', width: '100%', filter: 'contrast(0.92) saturate(0.85)' }} />

        {/* Spine */}
        <div style={{
          background: 'linear-gradient(to right, rgba(58,54,50,0.18), rgba(58,54,50,0.06) 40%, rgba(58,54,50,0.06) 60%, rgba(58,54,50,0.18))',
          boxShadow: 'inset -1px 0 3px rgba(58,54,50,0.12), inset 1px 0 3px rgba(58,54,50,0.12)',
        }} />

        {/* Right page — blank if no image */}
        {rightUrl ? (
          <img src={rightUrl} alt="" style={{ display: 'block', width: '100%', filter: 'contrast(0.92) saturate(0.85)' }} />
        ) : (
          <div style={{ background: 'var(--paper-warm)', minHeight: leftRef.current?.offsetHeight ?? 200 }} />
        )}
      </div>

      {/* Navigation */}
      {totalSpreads > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '14px' }}>
          <button onClick={() => setSpreadIndex((i) => Math.max(0, i - 2))} disabled={!canPrev} style={{ background: 'rgba(58,54,50,0.45)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: canPrev ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: canPrev ? 1 : 0.3 }}>
            <ChevronLeft size={16} color="white" />
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: totalSpreads }).map((_, i) => (
              <button key={i} onClick={() => setSpreadIndex(i * 2)} style={{ width: '6px', height: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: Math.floor(spreadIndex / 2) === i ? 'var(--ink-light)' : 'var(--ink-faint)', opacity: Math.floor(spreadIndex / 2) === i ? 1 : 0.4 }} />
            ))}
          </div>
          <button onClick={() => setSpreadIndex((i) => Math.min(urls.length % 2 === 0 ? urls.length - 2 : urls.length - 1, i + 2))} disabled={!canNext} style={{ background: 'rgba(58,54,50,0.45)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: canNext ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: canNext ? 1 : 0.3 }}>
            <ChevronRight size={16} color="white" />
          </button>
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
          className="w-full"
          style={{ maxWidth: memory.type === 'note' && memory.note?.note_type === 'handwritten' ? '900px' : '576px' }}
        >
          {/* Photo */}
          {memory.type === 'photo' && memory.photo && (
            <ImageGallery urls={memory.photo.images.map((i) => i.image_url)} />
          )}

          {/* Note: handwritten */}
          {memory.type === 'note' && memory.note?.note_type === 'handwritten' && memory.note.images.length > 0 && (
            <div>
              <BookSpread urls={memory.note.images.map((i) => i.image_url)} />
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
