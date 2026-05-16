import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X, Plus, Minus } from 'lucide-react';
import { getLocations, updateLocationParent } from '../../lib/locationService';
import { createPhotoMemory, createNoteMemory, createBookMemory } from '../../lib/memoryService';
import type { MediaItem } from '../../lib/memoryService';
import { createBook } from '../../lib/bookService';
import { searchBooks } from '../../lib/bookSearchService';
import type { BookSearchResult } from '../../lib/bookSearchService';
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

  const preselectedType = (searchParams.get('type') as MemoryType | null) ?? 'photo';
  const [type, setType] = useState<MemoryType>(preselectedType);
  const [noteSubtype, setNoteSubtype] = useState<NoteSubtype>('text');
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState(preselectedLocationId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // photo / note
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // preview URLs (thumbnail for video)
  const [liveVideoFiles, setLiveVideoFiles] = useState<(File | null)[]>([]);
  const [caption, setCaption] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveVideoInputRef = useRef<HTMLInputElement>(null);
  const [pendingLiveIdx, setPendingLiveIdx] = useState<number | null>(null);

  // book
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const [bookSearching, setBookSearching] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCoverUrl, setBookCoverUrl] = useState<string | null>(null);
  const [bookCoverFile, setBookCoverFile] = useState<File | null>(null);
  const [bookCoverPreview, setBookCoverPreview] = useState<string | null>(null);
  const [readingNotes, setReadingNotes] = useState('');
  const [bookReadDate, setBookReadDate] = useState(new Date().toISOString().slice(0, 10));
  const [quotes, setQuotes] = useState<string[]>(['']);
  const bookDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ uploaded: number; total: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
  }, []);

  useEffect(() => {
    setMediaItems([]);
    setImagePreviews([]);
    setLiveVideoFiles([]);
    setCaption('');
    setNoteContent('');
    setBookQuery('');
    setBookResults([]);
    setBookTitle('');
    setBookAuthor('');
    setBookCoverUrl(null);
    setBookCoverFile(null);
    setBookCoverPreview(null);
    setReadingNotes('');
    setBookReadDate(new Date().toISOString().slice(0, 10));
    setQuotes(['']);
    setError('');
  }, [type, noteSubtype]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';
    const MAX_VIDEO = 50 * 1024 * 1024;
    for (const file of files) {
      if (file.type.startsWith('video/') && file.size > MAX_VIDEO) {
        setError(`"${file.name}" 超过 50 MB 限制，请剪短后重新上传`);
        return;
      }
    }
    for (const file of files) {
      if (file.type.startsWith('video/')) {
        const { thumbnailBlob, previewUrl } = await extractVideoThumbnail(file);
        setMediaItems((prev) => [...prev, { file, type: 'video', thumbnailBlob }]);
        setImagePreviews((prev) => [...prev, previewUrl]);
        setLiveVideoFiles((prev) => [...prev, null]);
      } else {
        setMediaItems((prev) => [...prev, { file, type: 'image' }]);
        setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
        setLiveVideoFiles((prev) => [...prev, null]);
      }
    }
  }

  function removeImage(index: number) {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setLiveVideoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleLiveVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || pendingLiveIdx === null) return;
    e.target.value = '';
    setLiveVideoFiles((prev) => {
      const next = [...prev];
      next[pendingLiveIdx] = file;
      return next;
    });
    setPendingLiveIdx(null);
  }

  function extractVideoThumbnail(file: File): Promise<{ thumbnailBlob: Blob; previewUrl: string }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = 0.1;
      });
      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')!.drawImage(video, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('thumbnail failed')); return; }
          resolve({ thumbnailBlob: blob, previewUrl: URL.createObjectURL(blob) });
        }, 'image/jpeg', 0.8);
      });
      video.addEventListener('error', reject);
      video.load();
    });
  }

  function handleBookQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setBookQuery(q);
    if (bookDebounceRef.current) clearTimeout(bookDebounceRef.current);
    if (!q.trim()) { setBookResults([]); return; }
    bookDebounceRef.current = setTimeout(async () => {
      setBookSearching(true);
      setBookResults(await searchBooks(q));
      setBookSearching(false);
    }, 400);
  }

  function selectBookResult(result: BookSearchResult) {
    setBookTitle(result.title);
    setBookAuthor(result.author);
    setBookCoverUrl(result.coverUrl);
    setBookCoverFile(null);
    setBookCoverPreview(result.coverUrl);
    setBookQuery('');
    setBookResults([]);
  }

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBookCoverFile(file);
    setBookCoverUrl(null);
    setBookCoverPreview(URL.createObjectURL(file));
    e.target.value = '';
  }

  function updateQuote(index: number, value: string) {
    setQuotes((prev) => prev.map((q, i) => i === index ? value : q));
  }

  function addQuote() {
    setQuotes((prev) => [...prev, '']);
  }

  function removeQuote(index: number) {
    setQuotes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (type !== 'book' && !locationId) { setError('请选择地点'); return; }
    if (!date) { setError('请选择日期'); return; }
    if (type === 'photo' && mediaItems.length === 0) { setError('请至少上传一张照片或视频'); return; }
    if (type === 'note' && noteSubtype === 'handwritten' && mediaItems.length === 0) { setError('请至少上传一张手写笔记图片'); return; }
    if (type === 'note' && noteSubtype === 'text' && !noteContent.trim()) { setError('请输入笔记内容'); return; }
    if (type === 'book' && !bookTitle.trim()) { setError('请输入书名'); return; }

    setSaving(true);
    setUploadProgress(null);
    setError('');
    try {
      if (type === 'photo') {
        await createPhotoMemory(locationId, date, mediaItems, liveVideoFiles, caption || undefined, (uploaded, total) => setUploadProgress({ uploaded, total }));
        navigate(`/location/${locationId}`);
      } else if (type === 'note') {
        await createNoteMemory(locationId, date, noteSubtype, noteContent || undefined, mediaItems.length > 0 ? mediaItems.map((m) => m.file) : undefined);
        navigate(`/location/${locationId}`);
      } else if (type === 'book') {
        const filledQuotes = quotes.map((q) => q.trim()).filter(Boolean);
        const bookData = {
          title: bookTitle.trim(),
          author: bookAuthor.trim(),
          coverUrl: bookCoverUrl,
          coverFile: bookCoverFile ?? undefined,
          readingNotes: readingNotes.trim() || undefined,
        };
        if (locationId) {
          await createBookMemory(locationId, date, bookData, filledQuotes);
          navigate(`/location/${locationId}`);
        } else {
          const book = await createBook({ ...bookData, readDate: bookReadDate }, filledQuotes);
          navigate(`/book/${book.id}`);
        }
      }
    } catch (err: any) {
      setError(`保存失败：${err?.message || JSON.stringify(err)}`);
      console.error(err);
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  }

  const showImageUpload = type === 'photo' || (type === 'note' && noteSubtype === 'handwritten');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="min-h-screen p-6" style={{ fontFamily: 'var(--font-serif)' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to={locationId ? `/location/${locationId}` : '/'} style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }} className="inline-flex items-center gap-2 mb-6 hover:opacity-70 transition-opacity">
            <ArrowLeft size={16} /> 返回
          </Link>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} style={{ color: 'var(--ink-text)', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.02em' }}>
            添加記憶
          </motion.h2>
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 mb-8">
          {([{ key: 'photo', label: '照片' }, { key: 'note', label: '笔记' }, { key: 'book', label: '书籍' }] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setType(key)} className={`glass-chip${type === key ? ' active' : ''}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Note subtype */}
        {type === 'note' && (
          <div className="flex gap-2 mb-8">
            {(['text', 'handwritten'] as NoteSubtype[]).map((sub) => (
              <button key={sub} onClick={() => setNoteSubtype(sub)} className={`glass-chip${noteSubtype === sub ? ' active' : ''}`} style={{ fontSize: '0.75rem' }}>
                {sub === 'text' ? '文字' : '手写'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image upload (photo / handwritten note) */}
          {showImageUpload && (
            <div>
              <input ref={fileInputRef} type="file" accept={type === 'photo' ? 'image/*,video/*' : 'image/*'} multiple onChange={handleFileChange} className="hidden" />
              <input ref={liveVideoInputRef} type="file" accept="video/*" className="hidden" onChange={handleLiveVideoChange} />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative" style={{ aspectRatio: '1', overflow: 'hidden' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(0.92) saturate(0.85)' }} />
                      {mediaItems[i]?.type === 'video' && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(58,54,50,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><polygon points="0,0 10,6 0,12"/></svg>
                          </div>
                        </div>
                      )}
                      {type === 'photo' && mediaItems[i]?.type === 'image' && (
                        <button
                          type="button"
                          onClick={() => { setPendingLiveIdx(i); liveVideoInputRef.current?.click(); }}
                          style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', background: liveVideoFiles[i] ? 'rgba(70,120,70,0.8)' : 'rgba(58,54,50,0.6)', border: 'none', borderRadius: '6px', padding: '2px 6px', cursor: 'pointer', color: 'white', fontSize: '0.6rem', fontFamily: 'var(--font-serif)', whiteSpace: 'nowrap' }}
                        >
                          {liveVideoFiles[i] ? '✓ 实况' : '+ 实况'}
                        </button>
                      )}
                      <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(58,54,50,0.6)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <X size={12} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="glass-dropzone flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70" style={{ height: imagePreviews.length > 0 ? '48px' : '180px' }} onClick={() => fileInputRef.current?.click()}>
                <span style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>
                  {imagePreviews.length > 0 ? '+ 继续添加' : type === 'photo' ? '点击上传照片或视频（可多选）' : '上传手写笔记照片（可多选）'}
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

          {/* Book fields */}
          {type === 'book' && (
            <>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>搜索书名</label>
                <input
                  type="text"
                  value={bookQuery}
                  onChange={handleBookQueryChange}
                  placeholder="输入书名搜索…"
                  style={inputStyle}
                />
                {bookSearching && (
                  <span style={{ position: 'absolute', right: 0, bottom: '12px', color: 'var(--ink-faint)', fontSize: '0.75rem' }}>搜索中…</span>
                )}
                <AnimatePresence>
                  {bookResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(28,28,30,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', borderRadius: '12px', zIndex: 100, maxHeight: '240px', overflowY: 'auto', overflow: 'hidden' }}
                    >
                      {bookResults.map((r, i) => (
                        <button
                          key={r.id + i}
                          type="button"
                          onClick={() => selectBookResult(r)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: i < bookResults.length - 1 ? '1px solid var(--ink-faint)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-serif)' }}
                          className="hover:opacity-60 transition-opacity"
                        >
                          {r.coverUrl && <img src={r.coverUrl} alt="" style={{ width: '32px', height: '44px', objectFit: 'cover', flexShrink: 0 }} />}
                          <div>
                            <div style={{ color: 'var(--ink-text)', fontSize: '0.85rem' }}>{r.title}</div>
                            <div style={{ color: 'var(--ink-light)', fontSize: '0.75rem', marginTop: '2px' }}>{r.author}</div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Title */}
              <div>
                <label style={labelStyle}>书名</label>
                <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="书名" style={inputStyle} />
              </div>

              {/* Author */}
              <div>
                <label style={labelStyle}>作者</label>
                <input type="text" value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} placeholder="作者" style={inputStyle} />
              </div>

              {/* Cover */}
              <div>
                <label style={labelStyle}>封面（可选）</label>
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
                {bookCoverPreview ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                    <img src={bookCoverPreview} alt="" style={{ width: '80px', height: '110px', objectFit: 'cover', boxShadow: '0 2px 8px var(--paper-shadow)' }} />
                    <button type="button" onClick={() => { setBookCoverFile(null); setBookCoverUrl(null); setBookCoverPreview(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '0.75rem', fontFamily: 'var(--font-serif)', paddingBottom: '4px' }}>
                      移除
                    </button>
                  </div>
                ) : (
                  <div className="glass-dropzone flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity" style={{ width: '80px', height: '110px' }} onClick={() => coverInputRef.current?.click()}>
                    <span style={{ color: 'var(--ink-faint)', fontSize: '0.7rem', textAlign: 'center', padding: '4px' }}>上传封面</span>
                  </div>
                )}
              </div>

              {/* Read date — only for standalone books (no location) */}
              {!locationId && (
                <div>
                  <label style={labelStyle}>读完于</label>
                  <input type="date" value={bookReadDate} onChange={(e) => setBookReadDate(e.target.value)} style={inputStyle} />
                </div>
              )}

              {/* Reading notes */}
              <div>
                <label style={labelStyle}>读书笔记（可选）</label>
                <textarea value={readingNotes} onChange={(e) => setReadingNotes(e.target.value)} placeholder="写下你的感想…" rows={5} style={{ ...inputStyle, borderBottom: 'none', border: '1px solid var(--ink-faint)', padding: '12px', resize: 'vertical', lineHeight: '1.8' }} />
              </div>

              {/* Quotes */}
              <div>
                <label style={labelStyle}>摘录（可选）</label>
                <div className="space-y-3">
                  {quotes.map((q, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea
                        value={q}
                        onChange={(e) => updateQuote(i, e.target.value)}
                        placeholder={`摘录 ${i + 1}…`}
                        rows={2}
                        style={{ ...inputStyle, borderBottom: 'none', border: '1px solid var(--ink-faint)', padding: '8px 10px', resize: 'vertical', lineHeight: '1.7', fontSize: '0.85rem', flex: 1 }}
                      />
                      {quotes.length > 1 && (
                        <button type="button" onClick={() => removeQuote(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: '8px 0', flexShrink: 0 }}>
                          <Minus size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addQuote} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-light)', fontSize: '0.8rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                    <Plus size={12} /> 添加摘录
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Location */}
          <div>
            <label style={labelStyle}>{type === 'book' ? '地点（可选）' : '地点'}</label>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">选择地点</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {/* Parent location management (shown when a location is selected) */}
          {locationId && (() => {
            const selected = locations.find((l) => l.id === locationId);
            if (!selected) return null;
            return (
              <div>
                <label style={labelStyle}>「{selected.name}」的上属地点（可选）</label>
                <select
                  value={selected.parent_id ?? ''}
                  onChange={async (e) => {
                    const newParentId = e.target.value || null;
                    await updateLocationParent(locationId, newParentId).catch(console.error);
                    setLocations((prev) => prev.map((l) => l.id === locationId ? { ...l, parent_id: newParentId } : l));
                  }}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">无</option>
                  {locations.filter((l) => l.id !== locationId).map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            );
          })()}

          {/* Date */}
          <div>
            <label style={labelStyle}>日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </div>

          {error && <p style={{ color: 'var(--ink-light)', fontSize: '0.8rem' }}>{error}</p>}

          <div className="pt-4">
            <button type="submit" disabled={saving} className="glass-action-btn">
              {uploadProgress ? `上传中（${uploadProgress.uploaded}/${uploadProgress.total}）…` : saving ? '保存中…' : '保存記憶'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
