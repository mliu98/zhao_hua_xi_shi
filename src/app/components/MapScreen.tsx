import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { getLocations, createLocation, searchByName } from '../../lib/locationService';
import type { Location, NominatimResult } from '../../lib/types';

// Fix Leaflet default icon missing in Vite builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom ink-style marker
const inkIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:10px;height:10px;border-radius:50%;background:#3a3632;opacity:0.75;box-shadow:0 0 0 4px rgba(58,54,50,0.15)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
  }, []);

  useEffect(() => {
    if (pending) setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [pending]);

  function handleMapClick(lat: number, lng: number) {
    setPending({ lat, lng });
    setLocationName('');
  }

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
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }

  async function handleSaveLocation() {
    if (!pending || !locationName.trim()) return;
    setSaving(true);
    try {
      const newLocation = await createLocation(locationName.trim(), pending.lat, pending.lng);
      setLocations((prev) => [...prev, newLocation]);
      setPending(null);
      setLocationName('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col flex-1" style={{ fontFamily: 'var(--font-serif)' }}>
      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="px-6 pb-4 max-w-5xl mx-auto w-full relative"
      >
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="搜索城市或地标…"
          style={{
            width: '100%',
            maxWidth: '320px',
            padding: '6px 12px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--ink-faint)',
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
                top: '100%',
                left: '24px',
                width: '320px',
                background: 'var(--paper-bg)',
                border: '1px solid var(--ink-faint)',
                boxShadow: '0 4px 12px var(--paper-shadow)',
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
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="flex-1 px-6 pb-6"
      >
        <div
          className="w-full max-w-5xl mx-auto rounded-sm overflow-hidden"
          style={{ height: '500px', border: '1px solid var(--ink-faint)' }}
        >
          <MapContainer
            center={[30, 15]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              subdomains="abcd"
              maxZoom={19}
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {locations.map((location) => (
              <Marker
                key={location.id}
                position={[location.lat, location.lng]}
                icon={inkIcon}
                eventHandlers={{
                  click: () => window.location.href = `/location/${location.id}`,
                }}
              />
            ))}
          </MapContainer>
        </div>
      </motion.div>

      {/* Add Memory */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="text-center pb-8 px-6"
      >
        <Link
          to="/add"
          style={{ color: 'var(--ink-light)', fontSize: '0.875rem', textDecoration: 'none', borderBottom: '1px solid var(--ink-faint)', paddingBottom: '2px' }}
          className="hover:opacity-70 transition-opacity"
        >
          + 添加記憶
        </Link>
      </motion.div>

      {/* Name location dialog */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(58, 54, 50, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
            onClick={() => setPending(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--paper-bg)', padding: '32px', width: '280px', boxShadow: '0 8px 32px rgba(58, 54, 50, 0.15)', fontFamily: 'var(--font-serif)' }}
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
                  outline: 'none', marginBottom: '24px',
                }}
              />
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
                    background: 'transparent', border: 'none',
                    cursor: locationName.trim() ? 'pointer' : 'default',
                    color: locationName.trim() ? 'var(--ink-text)' : 'var(--ink-faint)',
                    fontSize: '0.875rem', fontFamily: 'var(--font-serif)',
                    borderBottom: locationName.trim() ? '1px solid var(--ink-text)' : 'none',
                    paddingBottom: '1px',
                  }}
                >
                  {saving ? '保存中…' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
