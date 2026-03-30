import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import {
  getLocations,
  getLocationById,
  getAncestors,
  getChildren,
  getDescendantIds,
} from '../../lib/locationService';
import { getMemoriesByLocationTree } from '../../lib/memoryService';
import type { Location, Memory } from '../../lib/types';

function MemoryCard({ memory, index, showLocation }: { memory: Memory; index: number; showLocation?: boolean }) {
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
              loading="lazy"
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
              loading="lazy"
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
              <img loading="lazy" src={memory.book.cover_url} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', filter: 'contrast(0.92) saturate(0.85)' }} />
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '5px', paddingLeft: '2px' }}>
          <span style={{ color: 'var(--ink-faint)', fontSize: '0.7rem' }}>{memory.date}</span>
          {showLocation && (memory as any).location?.name && (
            <span style={{ color: 'var(--ink-faint)', fontSize: '0.68rem' }}>{(memory as any).location.name}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

const filterBtnStyle = (active: boolean): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-serif)',
  fontSize: '0.78rem',
  color: active ? 'var(--ink-text)' : 'var(--ink-faint)',
  paddingBottom: '2px',
  borderBottom: active ? '1px solid var(--ink-text)' : 'none',
  transition: 'all 0.2s',
});

export function LocationMemoryScreen() {
  const { id } = useParams();
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'note' | 'book'>('all');
  const [subFilter, setSubFilter] = useState<string>('all'); // 'all' | locationId

  useEffect(() => {
    setLoading(true);
    setTypeFilter('all');
    setSubFilter('all');

    Promise.all([getLocations(), getLocationById(id!)])
      .then(async ([locs, loc]) => {
        setAllLocations(locs);
        setLocation(loc);
        if (loc) {
          const descendantIds = getDescendantIds(locs, loc.id);
          const allIds = [loc.id, ...descendantIds];
          const memories = await getMemoriesByLocationTree(allIds);
          setAllMemories(memories);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const ancestors = useMemo(
    () => location ? getAncestors(allLocations, location.id) : [],
    [allLocations, location]
  );

  const children = useMemo(
    () => location ? getChildren(allLocations, location.id) : [],
    [allLocations, location]
  );

  // Count all tree memories per child (for the chips)
  const childMemoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const child of children) {
      const childDescendantIds = getDescendantIds(allLocations, child.id);
      const childIds = new Set([child.id, ...childDescendantIds]);
      counts[child.id] = allMemories.filter((m) => childIds.has(m.location_id)).length;
    }
    return counts;
  }, [children, allLocations, allMemories]);

  const filteredMemories = useMemo(() => {
    let result = allMemories;

    // Sub-location filter
    if (subFilter !== 'all') {
      const subDescendantIds = getDescendantIds(allLocations, subFilter);
      const subIds = new Set([subFilter, ...subDescendantIds]);
      result = result.filter((m) => subIds.has(m.location_id));
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((m) => m.type === typeFilter);
    }

    return result;
  }, [allMemories, subFilter, typeFilter, allLocations]);

  const showLocationBadge = subFilter === 'all' && children.length > 0;

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
        <div className="mb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mb-6 flex-wrap" style={{ fontSize: '0.875rem', color: 'var(--ink-light)' }}>
            {ancestors.length > 0 ? (
              ancestors.map((a, i) => (
                <span key={a.id} className="inline-flex items-center gap-1">
                  <Link to={`/location/${a.id}`} style={{ color: 'var(--ink-light)' }} className="hover:opacity-70 transition-opacity">{a.name}</Link>
                  <span style={{ color: 'var(--ink-faint)' }}>›</span>
                </span>
              ))
            ) : (
              <Link to="/" style={{ color: 'var(--ink-light)' }} className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity">
                <ArrowLeft size={16} /> 返回
              </Link>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} style={{ color: 'var(--ink-text)', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.02em' }}>
              {location.name}
            </motion.h2>
            <Link to={`/add?locationId=${id}`} style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', textDecoration: 'none' }} className="hover:opacity-70 transition-opacity">
              + 添加
            </Link>
          </div>
        </div>

        {/* Sub-locations */}
        {children.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="mb-8">
            <p style={{ color: 'var(--ink-faint)', fontSize: '0.72rem', letterSpacing: '0.05em', marginBottom: '10px' }}>下属地点</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {children.map((child) => (
                <Link
                  key={child.id}
                  to={`/location/${child.id}`}
                  style={{
                    padding: '5px 12px',
                    border: '1px solid var(--ink-faint)',
                    color: 'var(--ink-text)',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  className="hover:opacity-70 transition-opacity"
                >
                  {child.name}
                  {childMemoryCounts[child.id] > 0 && (
                    <span style={{ color: 'var(--ink-faint)', fontSize: '0.7rem' }}>
                      {childMemoryCounts[child.id]}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filter bar */}
        {allMemories.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.6 }} className="flex items-center gap-6 mb-6 flex-wrap">
            {/* Type filter */}
            <div className="flex items-center gap-4">
              {(['all', 'photo', 'note', 'book'] as const).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)} style={filterBtnStyle(typeFilter === t)}>
                  {t === 'all' ? '全部' : t === 'photo' ? '照片' : t === 'note' ? '笔记' : '书籍'}
                </button>
              ))}
            </div>

            {/* Sub-location filter */}
            {children.length > 0 && (
              <div className="flex items-center gap-4" style={{ borderLeft: '1px solid var(--ink-faint)', paddingLeft: '16px' }}>
                <button onClick={() => setSubFilter('all')} style={filterBtnStyle(subFilter === 'all')}>所有下属</button>
                <button
                  onClick={() => setSubFilter(location.id)}
                  style={filterBtnStyle(subFilter === location.id)}
                >
                  仅本地
                </button>
                {children.map((child) => (
                  <button key={child.id} onClick={() => setSubFilter(child.id)} style={filterBtnStyle(subFilter === child.id)}>
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Memory grid */}
        {filteredMemories.length === 0 ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', textAlign: 'center', marginTop: '80px' }}>
            还没有记忆
          </motion.p>
        ) : (
          <div style={{ columns: '3 160px', columnGap: '16px' }}>
            {filteredMemories.map((memory, index) => (
              <MemoryCard key={memory.id} memory={memory} index={index} showLocation={showLocationBadge} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
