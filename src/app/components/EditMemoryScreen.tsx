import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, X, Plus, Minus } from 'lucide-react';
import { getMemoryById, updatePhotoMemory, updateNoteMemory, updateBookMemory } from '../../lib/memoryService';
// BookData re-exported from memoryService for backwards compat
import type { Memory, PhotoImage, NoteImage } from '../../lib/types';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 0', background: 'transparent', border: 'none',
  borderBottom: '1px solid var(--ink-faint)', color: 'var(--ink-text)',
  fontSize: '0.9rem', fontFamily: 'var(--font-serif)', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--ink-light)', fontSize: '0.75rem', display: 'block',
  marginBottom: '6px', letterSpacing: '0.05em',
};

export function EditMemoryScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Shared
  const [date, setDate] = useState('');

  // Photo
  const [caption, setCaption] = useState('');
  const [existingPhotoImages, setExistingPhotoImages] = useState<PhotoImage[]>([]);
  const [removePhotoIds, setRemovePhotoIds] = useState<string[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Note
  const [noteContent, setNoteContent] = useState('');
  const [existingNoteImages, setExistingNoteImages] = useState<NoteImage[]>([]);
  const [removeNoteIds, setRemoveNoteIds] = useState<string[]>([]);
  const [newNoteFiles, setNewNoteFiles] = useState<File[]>([]);
  const [newNotePreviews, setNewNotePreviews] = useState<string[]>([]);
  const noteInputRef = useRef<HTMLInputElement>(null);

  // Book
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCoverUrl, setBookCoverUrl] = useState<string | null>(null);
  const [bookCoverFile, setBookCoverFile] = useState<File | null>(null);
  const [bookCoverPreview, setBookCoverPreview] = useState<string | null>(null);
  const [readingNotes, setReadingNotes] = useState('');
  const [quotes, setQuotes] = useState<string[]>(['']);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMemoryById(id!).then((m) => {
      if (!m) return;
      setMemory(m);
      setDate(m.date);
      if (m.type === 'photo' && m.photo) {
        setCaption(m.photo.caption ?? '');
        setExistingPhotoImages(m.photo.images);
      }
      if (m.type === 'note' && m.note) {
        setNoteContent(m.note.content ?? '');
        setExistingNoteImages(m.note.images);
      }
      if (m.type === 'book' && m.book) {
        setBookTitle(m.book.title);
        setBookAuthor(m.book.author);
        setBookCoverUrl(m.book.cover_url);
        setBookCoverPreview(m.book.cover_url);
        setReadingNotes(m.book.reading_notes ?? '');
        setQuotes(m.book.quotes?.map((q) => q.content) ?? ['']);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setNewPhotoFiles((prev) => [...prev, ...files]);
    setNewPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  }

  function handleNoteFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setNewNoteFiles((prev) => [...prev, ...files]);
    setNewNotePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  }

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBookCoverFile(file);
    setBookCoverUrl(null);
    setBookCoverPreview(URL.createObjectURL(file));
    e.target.value = '';
  }

  function toggleRemovePhoto(imgId: string) {
    setRemovePhotoIds((prev) => prev.includes(imgId) ? prev.filter((x) => x !== imgId) : [...prev, imgId]);
  }

  function toggleRemoveNote(imgId: string) {
    setRemoveNoteIds((prev) => prev.includes(imgId) ? prev.filter((x) => x !== imgId) : [...prev, imgId]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memory) return;
    setSaving(true);
    setError('');
    try {
      if (memory.type === 'photo') {
        await updatePhotoMemory(memory.id, date, caption || undefined, newPhotoFiles, removePhotoIds);
      } else if (memory.type === 'note') {
        await updateNoteMemory(memory.id, date, noteContent || undefined, newNoteFiles, removeNoteIds);
      } else if (memory.type === 'book') {
        const filledQuotes = quotes.map((q) => q.trim()).filter(Boolean);
        await updateBookMemory(memory.id, date, {
          title: bookTitle.trim(),
          author: bookAuthor.trim(),
          coverUrl: bookCoverUrl,
          coverFile: bookCoverFile ?? undefined,
          readingNotes: readingNotes.trim() || undefined,
        }, filledQuotes);
      }
      navigate(`/memory/${memory.id}`);
    } catch (err: any) {
      setError(`保存失败：${err?.message || JSON.stringify(err)}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>…</div>;
  }

  if (!memory) {
    return <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>找不到这条记忆</div>;
  }

  const locationName = (memory as any).location?.name ?? '';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="min-h-screen p-6" style={{ fontFamily: 'var(--font-serif)' }}>
      <div className="max-w-md mx-auto">
        <div className="mb-10">
          <Link to={`/memory/${memory.id}`} style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }} className="inline-flex items-center gap-2 mb-6 hover:opacity-70 transition-opacity">
            <ArrowLeft size={16} /> 返回
          </Link>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} style={{ color: 'var(--ink-text)', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.02em' }}>
            编辑记忆
          </motion.h2>
          {locationName && <p style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', marginTop: '4px' }}>{locationName}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Photo fields */}
          {memory.type === 'photo' && (
            <>
              <div>
                <label style={labelStyle}>现有照片</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {existingPhotoImages.map((img) => {
                    const removing = removePhotoIds.includes(img.id);
                    return (
                      <div key={img.id} className="relative" style={{ aspectRatio: '1', overflow: 'hidden', opacity: removing ? 0.35 : 1 }}>
                        <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => toggleRemovePhoto(img.id)} style={{ position: 'absolute', top: '4px', right: '4px', background: removing ? 'rgba(200,80,60,0.7)' : 'rgba(58,54,50,0.6)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={12} color="white" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoFileChange} className="hidden" />
                {newPhotoPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {newPhotoPreviews.map((src, i) => (
                      <div key={i} className="relative" style={{ aspectRatio: '1', overflow: 'hidden' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(0.92) saturate(0.85)' }} />
                        <button type="button" onClick={() => { setNewPhotoFiles((p) => p.filter((_, j) => j !== i)); setNewPhotoPreviews((p) => p.filter((_, j) => j !== i)); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(58,54,50,0.6)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={12} color="white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity" style={{ height: '48px', border: '1px dashed var(--ink-faint)', background: 'var(--paper-warm)' }} onClick={() => photoInputRef.current?.click()}>
                  <span style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>+ 添加照片</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>备注（可选）</label>
                <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="写点什么…" style={inputStyle} />
              </div>
            </>
          )}

          {/* Note fields */}
          {memory.type === 'note' && memory.note?.note_type === 'handwritten' && (
            <>
              <div>
                <label style={labelStyle}>现有图片</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {existingNoteImages.map((img) => {
                    const removing = removeNoteIds.includes(img.id);
                    return (
                      <div key={img.id} className="relative" style={{ aspectRatio: '1', overflow: 'hidden', opacity: removing ? 0.35 : 1 }}>
                        <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => toggleRemoveNote(img.id)} style={{ position: 'absolute', top: '4px', right: '4px', background: removing ? 'rgba(200,80,60,0.7)' : 'rgba(58,54,50,0.6)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={12} color="white" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <input ref={noteInputRef} type="file" accept="image/*" multiple onChange={handleNoteFileChange} className="hidden" />
                {newNotePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {newNotePreviews.map((src, i) => (
                      <div key={i} className="relative" style={{ aspectRatio: '1', overflow: 'hidden' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(0.92) saturate(0.85)' }} />
                        <button type="button" onClick={() => { setNewNoteFiles((p) => p.filter((_, j) => j !== i)); setNewNotePreviews((p) => p.filter((_, j) => j !== i)); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(58,54,50,0.6)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={12} color="white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity" style={{ height: '48px', border: '1px dashed var(--ink-faint)', background: 'var(--paper-warm)' }} onClick={() => noteInputRef.current?.click()}>
                  <span style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}>+ 添加图片</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>标注（可选）</label>
                <input type="text" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="补充一点文字…" style={inputStyle} />
              </div>
            </>
          )}

          {memory.type === 'note' && memory.note?.note_type === 'text' && (
            <div>
              <label style={labelStyle}>笔记内容</label>
              <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={10} style={{ ...inputStyle, borderBottom: 'none', border: '1px solid var(--ink-faint)', padding: '12px', resize: 'vertical', lineHeight: '1.8' }} />
            </div>
          )}

          {/* Book fields */}
          {memory.type === 'book' && (
            <>
              <div>
                <label style={labelStyle}>书名</label>
                <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>作者</label>
                <input type="text" value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>封面</label>
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
                {bookCoverPreview ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                    <img src={bookCoverPreview} alt="" style={{ width: '80px', height: '110px', objectFit: 'cover', boxShadow: '0 2px 8px var(--paper-shadow)' }} />
                    <button type="button" onClick={() => coverInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '0.75rem', fontFamily: 'var(--font-serif)', paddingBottom: '4px' }}>更换</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity" style={{ width: '80px', height: '110px', border: '1px dashed var(--ink-faint)', background: 'var(--paper-warm)' }} onClick={() => coverInputRef.current?.click()}>
                    <span style={{ color: 'var(--ink-faint)', fontSize: '0.7rem', textAlign: 'center', padding: '4px' }}>上传封面</span>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>读书笔记（可选）</label>
                <textarea value={readingNotes} onChange={(e) => setReadingNotes(e.target.value)} rows={5} style={{ ...inputStyle, borderBottom: 'none', border: '1px solid var(--ink-faint)', padding: '12px', resize: 'vertical', lineHeight: '1.8' }} />
              </div>
              <div>
                <label style={labelStyle}>摘录</label>
                <div className="space-y-3">
                  {quotes.map((q, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea value={q} onChange={(e) => setQuotes((prev) => prev.map((x, j) => j === i ? e.target.value : x))} rows={2} style={{ ...inputStyle, borderBottom: 'none', border: '1px solid var(--ink-faint)', padding: '8px 10px', resize: 'vertical', lineHeight: '1.7', fontSize: '0.85rem', flex: 1 }} />
                      {quotes.length > 1 && (
                        <button type="button" onClick={() => setQuotes((prev) => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: '8px 0', flexShrink: 0 }}>
                          <Minus size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setQuotes((prev) => [...prev, ''])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-light)', fontSize: '0.8rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                    <Plus size={12} /> 添加摘录
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Date */}
          <div>
            <label style={labelStyle}>日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </div>

          {error && <p style={{ color: 'var(--ink-light)', fontSize: '0.8rem' }}>{error}</p>}

          <div className="pt-4">
            <button type="submit" disabled={saving} style={{ width: '100%', padding: '14px', background: 'var(--ink-text)', color: 'var(--paper-warm)', fontSize: '0.875rem', fontFamily: 'var(--font-serif)', border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? '保存中…' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
