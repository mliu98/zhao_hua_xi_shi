import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { getLocations } from '../../lib/locationService';
import { createPhotoMemory } from '../../lib/memoryService';
import type { Location } from '../../lib/types';

type MemoryType = 'photo' | 'note' | 'book';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 0',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--ink-faint)',
  color: 'var(--ink-text)',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-serif)',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--ink-light)',
  fontSize: '0.75rem',
  display: 'block',
  marginBottom: '6px',
  letterSpacing: '0.05em',
};

export function AddMemoryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLocationId = searchParams.get('locationId') ?? '';

  const [type, setType] = useState<MemoryType>('photo');
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState(preselectedLocationId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId) { setError('请选择地点'); return; }
    if (!date) { setError('请选择日期'); return; }
    if (type === 'photo' && !imageFile) { setError('请上传照片'); return; }

    setSaving(true);
    setError('');
    try {
      if (type === 'photo' && imageFile) {
        await createPhotoMemory(locationId, date, imageFile, caption || undefined);
        navigate(`/location/${locationId}`);
      }
    } catch (err: any) {
      const msg = err?.message || err?.error_description || JSON.stringify(err);
      setError(`保存失败：${msg}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const types: { key: MemoryType; label: string; enabled: boolean }[] = [
    { key: 'photo', label: '照片', enabled: true },
    { key: 'note', label: '笔记', enabled: false },
    { key: 'book', label: '书籍', enabled: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen p-6"
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link
            to={locationId ? `/location/${locationId}` : '/'}
            style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }}
            className="inline-flex items-center gap-2 mb-6 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={16} />
            返回
          </Link>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{ color: 'var(--ink-text)', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.02em' }}
          >
            添加記憶
          </motion.h2>
        </div>

        {/* Type tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex gap-6 mb-10"
        >
          {types.map(({ key, label, enabled }) => (
            <button
              key={key}
              onClick={() => enabled && setType(key)}
              disabled={!enabled}
              style={{
                background: 'none',
                border: 'none',
                cursor: enabled ? 'pointer' : 'default',
                fontFamily: 'var(--font-serif)',
                fontSize: '0.875rem',
                color: !enabled ? 'var(--ink-faint)' : type === key ? 'var(--ink-text)' : 'var(--ink-light)',
                paddingBottom: '4px',
                borderBottom: type === key && enabled ? '1px solid var(--ink-text)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Image upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {imagePreview ? (
              <div
                className="relative cursor-pointer overflow-hidden"
                style={{ boxShadow: '0 2px 8px var(--paper-shadow)' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full"
                  style={{ maxHeight: '320px', objectFit: 'cover', filter: 'contrast(0.92) saturate(0.85)' }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(248,246,241,0.75)', fontSize: '0.8rem', color: 'var(--ink-light)' }}
                >
                  点击更换
                </div>
              </div>
            ) : (
              <div
                className="flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70"
                style={{ height: '200px', border: '1px dashed var(--ink-faint)', background: 'var(--paper-warm)' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <span style={{ color: 'var(--ink-faint)', fontSize: '0.875rem' }}>点击上传照片</span>
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label style={labelStyle}>备注（可选）</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="写点什么…"
              style={inputStyle}
            />
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>地点</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">选择地点</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: 'var(--ink-light)', fontSize: '0.8rem' }}>{error}</p>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--ink-text)',
                color: 'var(--paper-warm)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-serif)',
                border: 'none',
                cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? '保存中…' : '保存記憶'}
            </button>
          </div>
        </motion.form>
      </div>
    </motion.div>
  );
}
