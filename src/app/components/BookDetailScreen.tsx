import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Minus, Plus, X } from 'lucide-react';
import { getBookById, updateBook, deleteBook, getLinkedMemories } from '../../lib/bookService';
import { searchBooks } from '../../lib/bookSearchService';
import type { BookSearchResult } from '../../lib/bookSearchService';
import { AnimatePresence } from 'motion/react';
import { useRef } from 'react';
import type { Book } from '../../lib/types';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 0', background: 'transparent', border: 'none',
  borderBottom: '1px solid var(--ink-faint)', color: 'var(--ink-text)',
  fontSize: '0.9rem', fontFamily: 'var(--font-serif)', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--ink-light)', fontSize: '0.75rem', display: 'block',
  marginBottom: '6px', letterSpacing: '0.05em',
};

type LinkedMemory = { memory_id: string; memory: { id: string; date: string; location: { name: string } | null } };

export function BookDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [linkedMemories, setLinkedMemories] = useState<LinkedMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Edit state
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCoverUrl, setBookCoverUrl] = useState<string | null>(null);
  const [bookCoverFile, setBookCoverFile] = useState<File | null>(null);
  const [bookCoverPreview, setBookCoverPreview] = useState<string | null>(null);
  const [readingNotes, setReadingNotes] = useState('');
  const [quotes, setQuotes] = useState<string[]>(['']);
  const [bookQuery, setBookQuery] = useState('');
  const [bookReadDate, setBookReadDate] = useState('');
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const bookDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      getBookById(id!),
      getLinkedMemories(id!),
    ]).then(([b, mems]) => {
      if (b) {
        setBook(b);
        setLinkedMemories(mems);
        resetEditState(b, mems);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  function resetEditState(b: Book, mems?: LinkedMemory[]) {
    setBookTitle(b.title);
    setBookAuthor(b.author);
    setBookCoverUrl(b.cover_url);
    setBookCoverPreview(b.cover_url);
    setBookCoverFile(null);
    setReadingNotes(b.reading_notes ?? '');
    // Pre-fill read_date: use explicit value if set, else earliest linked memory date
    const fallback = (mems ?? linkedMemories)[0]?.memory?.date ?? '';
    setBookReadDate(b.read_date ?? fallback);
    setQuotes(b.quotes.length > 0 ? b.quotes.map((q) => q.content) : ['']);
    setBookQuery('');
    setBookResults([]);
  }

  function handleBookQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setBookQuery(q);
    if (bookDebounceRef.current) clearTimeout(bookDebounceRef.current);
    if (!q.trim()) { setBookResults([]); return; }
    bookDebounceRef.current = setTimeout(async () => {
      setBookResults(await searchBooks(q));
    }, 400);
  }

  function selectBookResult(result: BookSearchResult) {
    setBookTitle(result.title);
    setBookAuthor(result.author);
    setBookCoverUrl(result.coverUrl);
    setBookCoverPreview(result.coverUrl);
    setBookCoverFile(null);
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

  async function handleSave() {
    if (!book) return;
    setSaving(true);
    setError('');
    try {
      const filledQuotes = quotes.map((q) => q.trim()).filter(Boolean);
      await updateBook(book.id, {
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        coverUrl: bookCoverUrl,
        coverFile: bookCoverFile ?? undefined,
        readingNotes: readingNotes.trim() || undefined,
        readDate: bookReadDate || null,
      }, filledQuotes);
      const updated = await getBookById(book.id);
      if (updated) setBook(updated);
      setEditing(false);
    } catch (err: any) {
      setError(`保存失败：${err?.message || JSON.stringify(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!book) return;
    setDeleting(true);
    try {
      await deleteBook(book.id);
      navigate('/bookshelf');
    } catch (err: any) {
      setError(`删除失败：${err?.message || JSON.stringify(err)}`);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
        …
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
        找不到这本书
      </div>
    );
  }

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
        <div className="mb-10 flex items-start justify-between">
          <Link
            to="/bookshelf"
            style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }}
            className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={16} /> 书架
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!editing && (
              confirmDelete ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--ink-faint)', fontSize: '0.75rem', fontFamily: 'var(--font-serif)' }}>确认删除？</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-light)', fontSize: '0.8rem', fontFamily: 'var(--font-serif)', opacity: deleting ? 0.5 : 1 }}
                  >
                    {deleting ? '删除中…' : '确认'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '0.8rem', fontFamily: 'var(--font-serif)' }}
                  >
                    取消
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '0.8rem', fontFamily: 'var(--font-serif)' }}
                  className="hover:opacity-70 transition-opacity"
                >
                  删除
                </button>
              )
            )}
            <button
              onClick={() => { editing ? (resetEditState(book), setEditing(false)) : setEditing(true); setConfirmDelete(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '0.8rem', fontFamily: 'var(--font-serif)' }}
              className="hover:opacity-70 transition-opacity"
            >
              {editing ? '取消' : '编辑'}
            </button>
          </div>
        </div>

        {editing ? (
          /* Edit mode */
          <div className="space-y-8">
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
              <AnimatePresence>
                {bookResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--paper-bg)', border: '1px solid var(--ink-faint)', boxShadow: '0 4px 12px var(--paper-shadow)', zIndex: 100, maxHeight: '240px', overflowY: 'auto' }}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button type="button" onClick={() => coverInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-light)', fontSize: '0.75rem', fontFamily: 'var(--font-serif)', textAlign: 'left' }}>更换</button>
                    <button type="button" onClick={() => { setBookCoverFile(null); setBookCoverUrl(null); setBookCoverPreview(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '0.75rem', fontFamily: 'var(--font-serif)', textAlign: 'left' }}>移除</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity" style={{ width: '80px', height: '110px', border: '1px dashed var(--ink-faint)', background: 'var(--paper-warm)' }} onClick={() => coverInputRef.current?.click()}>
                  <span style={{ color: 'var(--ink-faint)', fontSize: '0.7rem', textAlign: 'center', padding: '4px' }}>上传封面</span>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>读完于</label>
              <input type="date" value={bookReadDate} onChange={(e) => setBookReadDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>读书笔记（可选）</label>
              <textarea value={readingNotes} onChange={(e) => setReadingNotes(e.target.value)} rows={5} style={{ ...inputStyle, borderBottom: 'none', border: '1px solid var(--ink-faint)', padding: '12px', resize: 'vertical', lineHeight: '1.8' }} />
            </div>
            <div>
              <label style={labelStyle}>摘录（可选）</label>
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

            {error && <p style={{ color: 'var(--ink-light)', fontSize: '0.8rem' }}>{error}</p>}

            <div className="pt-4">
              <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '14px', background: 'var(--ink-text)', color: 'var(--paper-warm)', fontSize: '0.875rem', fontFamily: 'var(--font-serif)', border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? '保存中…' : '保存修改'}
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {/* Book info */}
            <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', marginBottom: '40px' }}>
              {book.cover_url && (
                <img src={book.cover_url} alt="" style={{ width: '120px', flexShrink: 0, boxShadow: '0 4px 16px var(--paper-shadow)', display: 'block' }} />
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ color: 'var(--ink-text)', fontSize: '1.4rem', fontWeight: 400, margin: '0 0 8px', lineHeight: 1.4 }}>
                  {book.title}
                </h2>
                {book.author && (
                  <p style={{ color: 'var(--ink-light)', fontSize: '0.875rem', margin: 0 }}>{book.author}</p>
                )}
              </div>
            </div>

            {book.reading_notes && (
              <div style={{ marginBottom: '36px' }}>
                <p style={{ color: 'var(--ink-text)', fontSize: '0.9rem', lineHeight: '1.9', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {book.reading_notes}
                </p>
              </div>
            )}

            {book.quotes.length > 0 && (
              <div style={{ borderLeft: '2px solid var(--ink-faint)', paddingLeft: '16px', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {book.quotes.map((q) => (
                  <p key={q.id || q.order} style={{ color: 'var(--ink-light)', fontSize: '0.875rem', lineHeight: '1.8', margin: 0, fontStyle: 'italic' }}>
                    {q.content}
                  </p>
                ))}
              </div>
            )}

            {/* Linked memories */}
            {linkedMemories.length > 0 && (
              <div>
                <p style={{ color: 'var(--ink-faint)', fontSize: '0.75rem', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  相关记忆
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {linkedMemories.map(({ memory }) => (
                    <Link
                      key={memory.id}
                      to={`/memory/${memory.id}`}
                      style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <span style={{ color: 'var(--ink-light)', fontSize: '0.85rem' }}>
                        {memory.location?.name ?? ''}
                      </span>
                      <span style={{ color: 'var(--ink-faint)', fontSize: '0.75rem' }}>{memory.date}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
