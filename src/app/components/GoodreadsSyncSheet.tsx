import { useEffect, useRef, useState } from 'react';
import { X, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchGoodreadsPreview,
  importBooks,
  getStoredGoodreadsUserId,
  setStoredGoodreadsUserId,
} from '../../lib/goodreadsSyncService';
import type { SyncPreviewItem } from '../../lib/goodreadsSyncService';
import { getLocations } from '../../lib/locationService';
import type { Location } from '../../lib/types';

type Status = 'idle' | 'loading' | 'preview' | 'importing' | 'done' | 'error'

const labelStyle: React.CSSProperties = {
  color: 'var(--ink-light)', fontSize: '0.7rem', display: 'block',
  marginBottom: '4px', letterSpacing: '0.05em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 0', background: 'transparent', border: 'none',
  borderBottom: '1px solid var(--ink-faint)', color: 'var(--ink-text)',
  fontSize: '0.9rem', fontFamily: 'var(--font-serif)', outline: 'none',
}

export function GoodreadsSyncSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState<Status>('idle')
  const [userId, setUserId] = useState(getStoredGoodreadsUserId() ?? '')
  const [items, setItems] = useState<SyncPreviewItem[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [result, setResult] = useState<{ booksImported: number; locationsCreated: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getLocations().then(setLocations).catch(console.error)
    // Auto-start if we already have a user ID
    if (getStoredGoodreadsUserId()) handleSync(getStoredGoodreadsUserId()!)
    else setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  async function handleSync(id: string) {
    if (!id.trim()) return
    setStoredGoodreadsUserId(id.trim())
    setStatus('loading')
    setErrorMsg('')
    try {
      const books = await fetchGoodreadsPreview(id.trim())
      if (books.length === 0) {
        setStatus('done')
        setResult({ booksImported: 0, locationsCreated: 0 })
        return
      }
      setItems(books.map((b) => ({ ...b, skipped: false })))
      setStatus('preview')
    } catch (err: any) {
      setErrorMsg(err?.message ?? String(err))
      setStatus('error')
    }
  }

  async function handleImport() {
    setStatus('importing')
    try {
      const res = await importBooks(items, locations)
      setResult(res)
      setStatus('done')
      onDone()
    } catch (err: any) {
      setErrorMsg(err?.message ?? String(err))
      setStatus('error')
    }
  }

  function toggleSkip(idx: number) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, skipped: !item.skipped } : item))
  }

  function setOverride(idx: number, locationId: string | null) {
    setItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, overrideLocationId: locationId === '__keep__' ? undefined : locationId } : item
    ))
  }

  const activeCount = items.filter((i) => !i.skipped).length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          width: '100%', maxWidth: '640px', margin: '0 auto',
          background: 'rgba(22,20,18,0.97)', backdropFilter: 'blur(24px)',
          borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          fontFamily: 'var(--font-serif)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px' }}>
          <h3 style={{ color: 'var(--ink-text)', fontSize: '1rem', fontWeight: 400, margin: 0 }}>
            同步 Goodreads
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>

          {/* Idle — user ID input */}
          {status === 'idle' && (
            <div>
              <p style={{ color: 'var(--ink-light)', fontSize: '0.8rem', marginBottom: '20px', lineHeight: 1.7 }}>
                在 Goodreads 个人主页 URL 里找到你的用户 ID（数字），例如：
                <br />
                <span style={{ color: 'var(--ink-faint)', fontSize: '0.75rem' }}>goodreads.com/user/show/<strong style={{ color: 'var(--ink-light)' }}>12345678</strong></span>
              </p>
              <label style={labelStyle}>Goodreads User ID</label>
              <input
                ref={inputRef}
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="12345678"
                style={inputStyle}
                onKeyDown={(e) => e.key === 'Enter' && handleSync(userId)}
              />
              <div style={{ marginTop: '24px' }}>
                <button
                  onClick={() => handleSync(userId)}
                  disabled={!userId.trim()}
                  className="glass-action-btn"
                  style={{ opacity: userId.trim() ? 1 : 0.4 }}
                >
                  开始同步
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
              正在拉取 Goodreads 书单并识别地点…
            </div>
          )}

          {/* Preview */}
          {status === 'preview' && (
            <div>
              <p style={{ color: 'var(--ink-light)', fontSize: '0.8rem', marginBottom: '16px' }}>
                检测到 <strong style={{ color: 'var(--ink-text)' }}>{activeCount}</strong> 本新书。确认后导入。
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {items.map((item, idx) => (
                  <PreviewRow
                    key={item.goodreads_id}
                    item={item}
                    locations={locations}
                    onSkip={() => toggleSkip(idx)}
                    onOverride={(id) => setOverride(idx, id)}
                  />
                ))}
              </div>
              <button
                onClick={handleImport}
                disabled={activeCount === 0}
                className="glass-action-btn"
                style={{ opacity: activeCount > 0 ? 1 : 0.4 }}
              >
                导入 {activeCount} 本书
              </button>
            </div>
          )}

          {/* Importing */}
          {status === 'importing' && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
              导入中…
            </div>
          )}

          {/* Done */}
          {status === 'done' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ color: 'var(--ink-text)', fontSize: '1rem', marginBottom: '8px' }}>
                {result?.booksImported === 0
                  ? '已是最新，没有新书'
                  : `已导入 ${result?.booksImported} 本书`}
              </p>
              {(result?.locationsCreated ?? 0) > 0 && (
                <p style={{ color: 'var(--ink-light)', fontSize: '0.8rem' }}>
                  新建了 {result?.locationsCreated} 个地点
                </p>
              )}
              <button onClick={onClose} className="glass-action-btn" style={{ marginTop: '24px' }}>
                关闭
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{ padding: '1rem 0' }}>
              <p style={{ color: 'var(--ink-light)', fontSize: '0.85rem', marginBottom: '16px' }}>{errorMsg}</p>
              <button onClick={() => setStatus('idle')} className="glass-action-btn">重试</button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function PreviewRow({
  item,
  locations,
  onSkip,
  onOverride,
}: {
  item: SyncPreviewItem
  locations: Location[]
  onSkip: () => void
  onOverride: (id: string | null) => void
}) {
  const detected = item.detectedLocation
  const effectiveLocationValue =
    item.overrideLocationId !== undefined
      ? (item.overrideLocationId ?? '')
      : detected
        ? (detected.isNew ? `__new__${detected.name}` : (detected.existingId ?? ''))
        : ''

  function handleSelect(val: string) {
    if (val === '__keep__') { onOverride('__keep__' as any); return }
    if (val === '') { onOverride(null); return }
    if (val.startsWith('__new__')) return // can't "select" the new-location pseudo-option
    onOverride(val)
  }

  return (
    <div style={{
      display: 'flex', gap: '12px', alignItems: 'flex-start',
      padding: '12px', borderRadius: '10px',
      background: item.skipped ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
      opacity: item.skipped ? 0.4 : 1,
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Cover */}
      {item.cover_url ? (
        <img src={item.cover_url} alt="" style={{ width: '40px', height: '56px', objectFit: 'cover', flexShrink: 0, borderRadius: '3px' }} loading="lazy" />
      ) : (
        <div style={{ width: '40px', height: '56px', flexShrink: 0, background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }} />
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--ink-text)', fontSize: '0.85rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </div>
        <div style={{ color: 'var(--ink-light)', fontSize: '0.75rem', marginBottom: '8px' }}>
          {item.author} · {item.date_read}
        </div>

        {/* Location selector */}
        <select
          value={effectiveLocationValue}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={item.skipped}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px', padding: '4px 8px', color: 'var(--ink-text)',
            fontSize: '0.75rem', fontFamily: 'var(--font-serif)', cursor: 'pointer',
            maxWidth: '100%',
          }}
        >
          <option value="">无地点</option>
          {detected?.isNew && (
            <option value={`__new__${detected.name}`} disabled>
              ★ 新建：{detected.name}（{detected.lat.toFixed(2)}°, {detected.lng.toFixed(2)}°）
            </option>
          )}
          {detected?.isNew && (
            <option value="" style={{ color: 'var(--ink-faint)' }}>↑ 使用上方新建地点</option>
          )}
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        {detected?.isNew && item.overrideLocationId === undefined && (
          <div style={{ color: 'rgba(140,200,140,0.7)', fontSize: '0.65rem', marginTop: '4px' }}>
            将新建地点「{detected.name}」（{detected.lat.toFixed(2)}°N, {detected.lng.toFixed(2)}°E）
          </div>
        )}
      </div>

      {/* Skip button */}
      <button
        onClick={onSkip}
        title={item.skipped ? '取消跳过' : '跳过这本'}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: '4px', flexShrink: 0, marginTop: '2px' }}
      >
        <SkipForward size={14} />
      </button>
    </div>
  )
}
