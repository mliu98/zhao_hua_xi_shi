import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxStyle from '../../mapbox-style.json';
import flower1Url from '../../assets/flowers/flower1.png';
import flower2Url from '../../assets/flowers/flower2.png';
import { getLocations, createLocation, searchByName, suggestParentFromDisplayName } from '../../lib/locationService';
import { getMemoriesByLocation } from '../../lib/memoryService';
import type { Location, Memory, NominatimResult } from '../../lib/types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function makeFlowerElement(isParent: boolean): HTMLElement {
  const el = document.createElement('div');
  const size = isParent ? 36 : 24;
  el.style.cssText = `cursor:pointer;width:${size}px;height:${size}px;`;
  const img = document.createElement('img');
  img.src = isParent ? flower1Url : flower2Url;
  img.style.cssText = `width:${size}px;height:${size}px;object-fit:contain;display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));`;
  img.draggable = false;
  el.appendChild(img);
  return el;
}

function pickRandom<T>(arr: T[]): T | null {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getTextSnippet(memories: Memory[]): string | null {
  const snippets: string[] = [];
  for (const m of memories) {
    if (m.type === 'note' && m.note?.note_type === 'text' && m.note.content) snippets.push(m.note.content);
    if (m.type === 'note' && m.note?.note_type === 'handwritten' && m.note.content) snippets.push(m.note.content);
    if (m.type === 'book' && m.book?.reading_notes) snippets.push(m.book.reading_notes);
    if (m.type === 'book' && m.book?.quotes) m.book.quotes.forEach((q) => snippets.push(q.content));
  }
  const pick = pickRandom(snippets);
  if (!pick) return null;
  const sentences = pick.match(/[^。！？.!?]+[。！？.!?]*/g) ?? [pick];
  const short = sentences.slice(0, 2).join('').trim();
  return short.length > 50 ? short.slice(0, 50) + '…' : short;
}

function getRandomPhoto(memories: Memory[]): string | null {
  const urls: string[] = [];
  for (const m of memories) {
    if (m.type === 'photo' && m.photo?.images) m.photo.images.forEach((i) => urls.push(i.image_url));
    if (m.type === 'note' && m.note?.images) m.note.images.forEach((i) => urls.push(i.image_url));
    if (m.type === 'book' && m.book?.cover_url) urls.push(m.book.cover_url);
  }
  return pickRandom(urls);
}

function buildPopupHTML(memories: Memory[]): string {
  const photo = getRandomPhoto(memories);
  const snippet = getTextSnippet(memories);
  const count = memories.length;
  return `<div style="font-family:var(--font-serif);width:180px;padding:2px;">
    ${photo ? `<img src="${photo}" alt="" style="width:100%;height:110px;object-fit:cover;display:block;margin-bottom:10px;filter:contrast(0.92) saturate(0.85);" />` : ''}
    ${snippet ? `<p style="color:var(--ink-light);font-size:0.75rem;line-height:1.7;margin:0 0 8px;font-style:italic;">${escapeHtml(snippet)}</p>` : ''}
    <p style="color:var(--ink-faint);font-size:0.7rem;margin:0;">${count === 0 ? '还没有记忆' : `${count} 条记忆`}</p>
  </div>`;
}

export function MapScreen() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const memoriesCacheRef = useRef<Record<string, Memory[]>>({});
  const mapLoadedRef = useRef(false);
  const locationsRef = useRef<Location[]>([]);

  const [locations, setLocations] = useState<Location[]>([]);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [suggestedParent, setSuggestedParent] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);


  function syncMarkers(map: mapboxgl.Map, locs: Location[]) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const parentIds = new Set(locs.map((l) => l.parent_id).filter(Boolean) as string[]);

    for (const location of locs) {
      const isParent = parentIds.has(location.id);
      const el = makeFlowerElement(isParent);

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: isParent ? 14 : 10,
        maxWidth: '200px',
        className: 'ink-popup',
      });

      let hovered = false;

      el.addEventListener('mouseenter', async () => {
        hovered = true;
        if (!memoriesCacheRef.current[location.id]) {
          const memories = await getMemoriesByLocation(location.id).catch(() => []);
          memoriesCacheRef.current[location.id] = memories;
        }
        if (!hovered) return;
        popup.setHTML(buildPopupHTML(memoriesCacheRef.current[location.id]));
        popup.setLngLat([location.lng, location.lat]).addTo(map);
      });

      el.addEventListener('mouseleave', () => {
        hovered = false;
        popup.remove();
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `/location/${location.id}`;
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([location.lng, location.lat])
        .addTo(map);

      markersRef.current.set(location.id, marker);
    }
  }

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: mapboxStyle as any,
      center: [15, 30],
      zoom: 1.5,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      projection: 'globe' as any,
    });

    map.on('load', () => {
      mapLoadedRef.current = true;
      map.setFog({
        color: 'rgba(24, 28, 36, 0.9)',
        'high-color': 'rgba(12, 18, 40, 1)',
        'horizon-blend': 0.04,
        'space-color': 'rgba(2, 5, 15, 1)',
        'star-intensity': 0.6,
      });
      if (locationsRef.current.length > 0) {
        syncMarkers(map, locationsRef.current);
      }
    });

    map.on('click', (e) => {
      setPending({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      setLocationName('');
      setParentId('');
      setSuggestedParent(null);
    });

    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      mapLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    getLocations().then((locs) => {
      setLocations(locs);
      locationsRef.current = locs;
    }).catch(console.error);
  }, []);

  useEffect(() => {
    locationsRef.current = locations;
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    syncMarkers(map, locations);
  }, [locations]);

  useEffect(() => {
    if (pending) setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [pending]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchResults(await searchByName(q));
    }, 350);
  }

  function handleSelectSearchResult(result: NominatimResult) {
    setSearchQuery('');
    setSearchResults([]);
    setPending({ lat: result.lat, lng: result.lng });
    setLocationName(result.name);
    setParentId('');
    const suggested = suggestParentFromDisplayName(result.displayName, locations);
    setSuggestedParent(suggested);
    mapRef.current?.flyTo({ center: [result.lng, result.lat], zoom: 8, duration: 1500 });
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }

  async function handleSaveLocation() {
    if (!pending || !locationName.trim()) return;
    setSaving(true);
    try {
      const resolvedParentId = parentId || (suggestedParent ? suggestedParent.id : null);
      const newLocation = await createLocation(locationName.trim(), pending.lat, pending.lng, resolvedParentId);
      setLocations((prev) => [...prev, newLocation]);
      setPending(null);
      setLocationName('');
      setParentId('');
      setSuggestedParent(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Full-viewport Mapbox globe — behind header/nav (z-index 0) */}
      <div
        ref={mapContainerRef}
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />

      {/* Floating UI — above header (z-index 20) */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 20,
          pointerEvents: 'none',
          fontFamily: 'var(--font-serif)',
        }}
      >
        {/* Search bar — below nav area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{ position: 'absolute', top: '11rem', left: 24, pointerEvents: 'auto' }}
        >
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="搜索城市或地标…"
              style={{
                width: '240px',
                padding: '10px 14px',
                background: 'rgba(30,30,30,0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                color: 'var(--ink-text)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-serif)',
                outline: 'none',
              }}
            />
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)', left: 0,
                    width: '320px',
                    background: 'rgba(28,28,30,0.88)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    zIndex: 1000,
                  }}
                >
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSearchResult(result)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-serif)', fontSize: '0.8rem', color: 'var(--ink-text)',
                        borderBottom: i < searchResults.length - 1 ? '1px solid var(--ink-faint)' : 'none',
                      }}
                      className="hover:opacity-60 transition-opacity"
                    >
                      <div style={{ fontWeight: 500 }}>{result.name}</div>
                      <div style={{ color: 'var(--ink-light)', fontSize: '0.72rem', marginTop: '2px' }}>
                        {result.displayName}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Add memory — bottom center */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          style={{
            position: 'absolute', bottom: 28,
            left: '50%', transform: 'translateX(-50%)',
            pointerEvents: 'auto',
          }}
        >
          <Link
            to="/add"
            style={{
              color: 'var(--accent-gold)',
              fontSize: '0.875rem',
              textDecoration: 'none',
              fontFamily: 'var(--font-serif)',
              padding: '8px 22px',
              background: 'rgba(30,30,30,0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,200,100,0.28)',
              borderRadius: '999px',
              display: 'inline-block',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}
            className="hover:opacity-80 transition-opacity"
          >
            + 添加記憶
          </Link>
        </motion.div>
      </div>

      {/* Name location dialog */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(58, 54, 50, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000,
            }}
            onClick={() => setPending(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(28,28,30,0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                borderRadius: '16px',
                padding: '28px',
                width: '300px',
                fontFamily: 'var(--font-serif)',
              }}
            >
              <p style={{ color: 'var(--ink-light)', fontSize: '0.8rem', marginBottom: '16px' }}>
                给这个地点起个名字
              </p>
              <input
                ref={nameInputRef}
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLocation(); if (e.key === 'Escape') setPending(null); }}
                placeholder="例如：京都·嵐山"
                style={{
                  width: '100%', padding: '6px 0', background: 'transparent',
                  border: 'none', borderBottom: '1px solid var(--ink-faint)',
                  color: 'var(--ink-text)', fontSize: '1rem', fontFamily: 'var(--font-serif)',
                  outline: 'none', marginBottom: '20px',
                }}
              />
              {suggestedParent && !parentId && (
                <div style={{ marginBottom: '16px', padding: '8px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', fontSize: '0.78rem', color: 'var(--ink-light)' }}>
                  检测到上属地点「{suggestedParent.name}」，是否设置？
                  <div style={{ marginTop: '6px', display: 'flex', gap: '12px' }}>
                    <button onClick={() => setParentId(suggestedParent.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-text)', fontSize: '0.78rem', fontFamily: 'var(--font-serif)', borderBottom: '1px solid var(--ink-text)', paddingBottom: '1px' }}>是</button>
                    <button onClick={() => setSuggestedParent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '0.78rem', fontFamily: 'var(--font-serif)' }}>否</button>
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ color: 'var(--ink-faint)', fontSize: '0.72rem', marginBottom: '6px', letterSpacing: '0.05em' }}>上属地点（可选）</p>
                <select
                  value={parentId}
                  onChange={(e) => { setParentId(e.target.value); setSuggestedParent(null); }}
                  style={{
                    width: '100%', padding: '6px 0', background: 'transparent',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--ink-text)', fontSize: '0.875rem', fontFamily: 'var(--font-serif)',
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="">无</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setPending(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '0.875rem', fontFamily: 'var(--font-serif)' }}
                >
                  取消
                </button>
                <button
                  onClick={handleSaveLocation}
                  disabled={!locationName.trim() || saving}
                  style={{
                    background: locationName.trim() ? 'rgba(255,200,100,0.88)' : 'transparent',
                    border: locationName.trim() ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    cursor: locationName.trim() ? 'pointer' : 'default',
                    color: locationName.trim() ? '#1a1200' : 'var(--ink-faint)',
                    fontSize: '0.875rem', fontFamily: 'var(--font-serif)',
                    opacity: saving ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {saving ? '保存中…' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
