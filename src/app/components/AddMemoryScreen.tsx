import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, X } from 'lucide-react';
import { getLocations } from '../../lib/locationService';
import { createPhotoMemory, createNoteMemory } from '../../lib/memoryService';
import type { Location } from '../../lib/types';

type MemoryType = 'photo' | 'note' | 'book';
type NoteSubtype = 'text' | 'handwritten';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 0', background: 'transparent', border: 'none',
  borderBottom: '1px solid var(--ink-faint)', color: 'var(--ink-text)',
  fontSize: '0.9rem', fontFamily: 'var(--font-serif)', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--ink-light)', fontSize: '0.75rem', display: 'block',
  marginBottom: '6px', letterSpacing: '0.05em',
};

export function AddMemoryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLocationId = searchParams.get('locationId') ?? '';

  const [type, setType] = useState<MemoryType>('photo');
  const [noteSubtype, setNoteSubtype] = useState<NoteSubtype>('text');
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState(preselectedLocationId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
  }, []);

  useEffect(() => {
    setImageFiles([]);
    setImagePreviews([]);
    setCaption('');
    setNoteContent('');
    setError('');
  }, [type, noteSubtype]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId) { setError('请选择地点'); return; }
    if (!date) { setError('请选择日期'); return; }
    if (type === 'photo' && imageFiles.length === 0) { setError('请至少上传一张照片'); return; }
    if (type === 'note' && noteSubtype === 'handwritten' && imageFiles.length === 0) { setError('请至少上传一张手写笔记图片'); return; }
    if (type === 'note' && noteSubtype === 'text' && !noteContent.trim()) { setError('请输入笔记内容'); return; }

    setSaving(true);
    setError('');
    try {
      if (type === 'photo') {
        await createPhotoMemory(locationId, date, imageFiles, caption || undefined);
      } else if (type === 'note') {
        await createNoteMemory(locationId, date, noteSubtype, noteContent || undefined, imageFiles.length > 0 ? imageFiles : undefined);
      }
      navigate(`/location/${locationId}`);
    } catch (err: any) {
      setError(`保存失败：${err?.message || JSON.stringify(err)}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const showImageUpload = type === 'photo' || (type === 'note' && noteSubtype === 'handwritten');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="min-h-screen p-6" style={{ fontFamily: 'var(--font-serif)' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link to={locationId ? `/location/${locationId}` : '/'} style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }} className="inline-flex items-center gap-2 mb-6 hover:opacity-70 transition-opacity">
            <ArrowLeft size={16} /> 返回
          </Link>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} style={{ color: 'var(--ink-text)', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.02em' }}>
            添加記憶
          </motion.h2>
        </div>

        {/* Type tabs */}
        <div className="flex gap-6 mb-8">
          {([{ key: 'photo', label: '照片', enabled: true }, { key: 'note', label: '笔记', enabled: true }, { key: 'book', label: '书籍', enabled: false }] as const).map(({ key, label, enabled }) => (
            <button key={key} onClick={() => enabled && setType(key as MemoryType)} disabled={!enabled} style={{ background: 'none', border: 'none', cursor: enabled ? 'pointer' : 'default', fontFamily: 'var(--font-serif)', fontSize: '0.875rem', color: !enabled ? 'var(--ink-faint)' : type === key ? 'var(--ink-text)' : 'var(--ink-light)', paddingBottom: '4px', borderBottom: type === key && enabled ? '1px solid var(--ink-text)' : 'none', transition: 'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Note subtype */}
        {type === 'note' && (
          <div className="flex gap-4 mb-8">
            {(['text', 'handwritten'] as NoteSubtype[]).map((sub) => (
              <button key={sub} onClick={() => setNoteSubtype(sub)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-serif)', fontSize: '0.8rem', color: noteSubtype === sub ? 'var(--ink-text)' : 'var(--ink-faint)', paddingBottom: '2px', borderBottom: noteSubtype === sub ? '1px solid var(--ink-faint)' : 'none' }}>
                {sub === 'text' ? '文字' : '手写'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image upload area */}
          {showImageUpload && (
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

              {/* Previews grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative" style={{ aspectRatio: '1', overflow: 'hidden' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(0.92) saturate(0.85)' }} />
                      <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(58,54,50,0.6)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <X size={12} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add more / first upload button */}
              <div className="flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70" style={{ height: imagePreviews.length > 0 ? '48px' : '180px', border: '1px dashed var(--ink-faint)', background: 'var(--paper-warm)' }} onClick={() => fileInputRef.current?.click()}>
                <span style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>
                  {imagePreviews.length > 0 ? '+ 继续添加' : type === 'photo' ? '点击上传照片（可多选）' : '上传手写笔记照片（可多选）'}
                </span>
              </div>
            </div>
          )}

          {/* Photo caption */}
          {type === 'photo' && (
            <div>
              <label style={labelStyle}>备注（可选）</label>
              <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="写点什么…" style={inputStyle} />
            </div>
          )}

          {/* Note text */}
          {type === 'note' && noteSubtype === 'text' && (
            <div>
              <label style={labelStyle}>笔记内容</label>
              <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="写下当时的想法…" rows={8} style={{ ...inputStyle, borderBottom: 'none', border: '1px solid var(--ink-faint)', padding: '12px', resize: 'vertical', lineHeight: '1.8' }} />
            </div>
          )}

          {/* Handwritten annotation */}
          {type === 'note' && noteSubtype === 'handwritten' && (
            <div>
              <label style={labelStyle}>标注（可选）</label>
              <input type="text" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="补充一点文字…" style={inputStyle} />
            </div>
          )}

          {/* Location */}
          <div>
            <label style={labelStyle}>地点</label>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">选择地点</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </div>

          {error && <p style={{ color: 'var(--ink-light)', fontSize: '0.8rem' }}>{error}</p>}

          <div className="pt-4">
            <button type="submit" disabled={saving} style={{ width: '100%', padding: '14px', background: 'var(--ink-text)', color: 'var(--paper-warm)', fontSize: '0.875rem', fontFamily: 'var(--font-serif)', border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? '保存中…' : '保存記憶'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
