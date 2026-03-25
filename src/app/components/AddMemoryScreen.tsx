import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { locations } from '../data/memories';

export function AddMemoryScreen() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save the memory
    // For now, just navigate back to the map
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen p-6"
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      {/* Header */}
      <div className="max-w-md mx-auto mb-12">
        <Link
          to="/"
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
          style={{
            color: 'var(--ink-text)',
            fontSize: '1.5rem',
            fontWeight: 400,
            letterSpacing: '0.02em',
          }}
        >
          添加記憶
        </motion.h2>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        onSubmit={handleSubmit}
        className="max-w-md mx-auto space-y-8"
      >
        {/* Image Upload */}
        <div>
          <label
            htmlFor="image-upload"
            style={{
              color: 'var(--ink-text)',
              fontSize: '0.875rem',
              display: 'block',
              marginBottom: '12px',
              fontWeight: 400,
            }}
          >
            筆記或照片
          </label>
          <div
            className="border-2 border-dashed p-12 text-center cursor-pointer transition-colors hover:border-opacity-60"
            style={{
              borderColor: 'var(--ink-faint)',
              background: 'var(--paper-warm)',
            }}
          >
            <input
              type="file"
              id="image-upload"
              className="hidden"
              accept="image/*"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer"
              style={{ color: 'var(--ink-light)', fontSize: '0.875rem' }}
            >
              點擊上傳圖片
            </label>
          </div>
        </div>

        {/* Location Selection */}
        <div>
          <label
            htmlFor="location"
            style={{
              color: 'var(--ink-text)',
              fontSize: '0.875rem',
              display: 'block',
              marginBottom: '12px',
              fontWeight: 400,
            }}
          >
            地點
          </label>
          <select
            id="location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--paper-warm)',
              border: '1px solid var(--ink-faint)',
              color: 'var(--ink-text)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-serif)',
              outline: 'none',
            }}
            className="transition-colors focus:border-opacity-80"
          >
            <option value="">選擇地點</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        {/* Book Reference (Optional) */}
        <div className="pt-4">
          <div
            style={{
              color: 'var(--ink-light)',
              fontSize: '0.875rem',
              marginBottom: '16px',
              fontStyle: 'italic',
            }}
          >
            書籍關聯（可選）
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                id="book-title"
                placeholder="書名"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--paper-warm)',
                  border: '1px solid var(--ink-faint)',
                  color: 'var(--ink-text)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-serif)',
                  outline: 'none',
                }}
                className="transition-colors focus:border-opacity-80"
              />
            </div>

            <div>
              <input
                type="text"
                id="book-author"
                placeholder="作者"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--paper-warm)',
                  border: '1px solid var(--ink-faint)',
                  color: 'var(--ink-text)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-serif)',
                  outline: 'none',
                }}
                className="transition-colors focus:border-opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-8">
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--ink-text)',
              color: 'var(--paper-warm)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-serif)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            className="hover:opacity-85"
          >
            保存記憶
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
