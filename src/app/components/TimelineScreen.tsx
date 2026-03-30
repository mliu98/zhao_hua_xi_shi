import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { getAllMemories } from '../../lib/memoryService';
import type { Memory } from '../../lib/types';

function MemoryThumbnail({ memory }: { memory: Memory }) {
  const thumbStyle: React.CSSProperties = {
    width: 60,
    height: 60,
    objectFit: 'cover',
    flexShrink: 0,
    border: '1px solid var(--ink-faint)',
    display: 'block',
  };

  if (memory.type === 'photo' && memory.photo?.images[0]) {
    return (
      <img
        src={memory.photo.images[0].image_url}
        alt={memory.photo.caption ?? '照片'}
        loading="lazy"
        style={thumbStyle}
      />
    );
  }

  if (memory.type === 'note') {
    if (memory.note?.note_type === 'handwritten' && memory.note.images[0]) {
      return (
        <img
          src={memory.note.images[0].image_url}
          alt="手写笔记"
          loading="lazy"
          style={thumbStyle}
        />
      );
    }
    // text note — show excerpt in a box
    const excerpt = memory.note?.content
      ? memory.note.content.slice(0, 40)
      : '';
    return (
      <div
        style={{
          ...thumbStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--paper-warm)',
          padding: '4px',
          fontSize: '0.65rem',
          color: 'var(--ink-light)',
          fontFamily: 'var(--font-serif)',
          overflow: 'hidden',
          lineHeight: 1.4,
          wordBreak: 'break-all',
        }}
      >
        {excerpt || '…'}
      </div>
    );
  }

  if (memory.type === 'book') {
    if (memory.book?.cover_url) {
      return (
        <img
          src={memory.book.cover_url}
          alt={memory.book.title}
          loading="lazy"
          style={thumbStyle}
        />
      );
    }
    return (
      <div
        style={{
          ...thumbStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--paper-warm)',
          padding: '6px',
          fontSize: '0.65rem',
          color: 'var(--ink-light)',
          fontFamily: 'var(--font-serif)',
          textAlign: 'center',
          wordBreak: 'break-all',
        }}
      >
        {memory.book?.title ?? '书'}
      </div>
    );
  }

  // fallback placeholder
  return (
    <div
      style={{
        ...thumbStyle,
        background: 'var(--paper-warm)',
      }}
    />
  );
}

function typeLabel(memory: Memory): string {
  if (memory.type === 'photo') return '照片';
  if (memory.type === 'book') return '读书';
  if (memory.type === 'note') {
    return memory.note?.note_type === 'handwritten' ? '手写' : '文字';
  }
  return '';
}

export function TimelineScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAllMemories()
      .then(setMemories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className="flex-1 px-6 pb-8"
      style={{ maxWidth: '720px', margin: '0 auto', width: '100%', fontFamily: 'var(--font-serif)' }}
    >
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              paddingTop: '80px',
              color: 'var(--ink-faint)',
              fontSize: '0.875rem',
            }}
          >
            …
          </div>
        ) : memories.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              paddingTop: '80px',
              color: 'var(--ink-faint)',
              fontSize: '0.875rem',
            }}
          >
            还没有记忆
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {memories.map((memory, i) => {
              const locationName = (memory as any).location?.name ?? '';
              return (
                <motion.li
                  key={memory.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.04, duration: 0.5 }}
                >
                  <button
                    onClick={() => navigate(`/memory/${memory.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--ink-faint)',
                      padding: '16px 0',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {/* Thumbnail */}
                    <MemoryThumbnail memory={memory} />

                    {/* Meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: 'var(--ink-text)',
                          fontSize: '0.875rem',
                          marginBottom: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {locationName || '未知地点'}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span
                          style={{
                            color: 'var(--ink-faint)',
                            fontSize: '0.75rem',
                          }}
                        >
                          {memory.date}
                        </span>
                        <span
                          style={{
                            color: 'var(--ink-light)',
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            border: '1px solid var(--ink-faint)',
                          }}
                        >
                          {typeLabel(memory)}
                        </span>
                      </div>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
    </motion.div>
  );
}
