import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { getAllBooks } from '../../lib/bookService';
import type { Book } from '../../lib/types';

const SPINE_COLORS = [
  '#3d5a47', '#8b4a2b', '#2c3e5a', '#5c4033',
  '#4a3550', '#5a5a2c', '#7a3535', '#384a5a',
];

function spineColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return SPINE_COLORS[Math.abs(hash) % SPINE_COLORS.length];
}

function BookSpine({ book, index }: { book: Book; index: number }) {
  const color = spineColor(book.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.6 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      style={{ display: 'inline-block' }}
    >
      <Link to={`/book/${book.id}`} style={{ textDecoration: 'none' }}>
        <div
          style={{
            width: '48px',
            height: '220px',
            background: color,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 0',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: '2px 0 6px rgba(0,0,0,0.18), inset -1px 0 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Title */}
          <span
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255,255,255,0.88)',
              fontSize: '0.75rem',
              letterSpacing: '0.04em',
              fontFamily: 'var(--font-serif)',
              maxHeight: '150px',
              overflow: 'hidden',
              lineHeight: 1,
            }}
          >
            {book.title}
          </span>
          {/* Author */}
          <span
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.6rem',
              letterSpacing: '0.03em',
              fontFamily: 'var(--font-serif)',
              maxHeight: '60px',
              overflow: 'hidden',
              lineHeight: 1,
            }}
          >
            {book.author}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function BookshelfScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllBooks().then(setBooks).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: 'var(--font-serif)', minHeight: '60vh', paddingBottom: '4rem' }}>
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: '40vh', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
          …
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="px-6 max-w-5xl mx-auto"
        >
          {books.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '6rem', color: 'var(--ink-faint)', fontSize: '0.875rem' }}>
              <p style={{ marginBottom: '2rem' }}>书架还空着</p>
              <Link
                to="/add?type=book"
                style={{ color: 'var(--ink-light)', fontSize: '0.875rem', textDecoration: 'none', borderBottom: '1px solid var(--ink-faint)', paddingBottom: '2px' }}
                className="hover:opacity-70 transition-opacity"
              >
                + 添加第一本书
              </Link>
            </div>
          ) : (
            <>
              {/* Shelf */}
              <div style={{ position: 'relative' }}>
                {/* Books row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    alignItems: 'flex-end',
                    paddingBottom: '12px',
                  }}
                >
                  {books.map((book, i) => (
                    <BookSpine key={book.id} book={book} index={i} />
                  ))}
                </div>
                {/* Shelf plank */}
                <div
                  style={{
                    height: '10px',
                    background: 'linear-gradient(180deg, #c8b89a 0%, #b5a284 100%)',
                    boxShadow: '0 4px 8px rgba(80,60,40,0.25)',
                    borderRadius: '1px',
                  }}
                />
              </div>

              {/* Add button */}
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <Link
                  to="/add?type=book"
                  style={{ color: 'var(--ink-light)', fontSize: '0.875rem', textDecoration: 'none', borderBottom: '1px solid var(--ink-faint)', paddingBottom: '2px' }}
                  className="hover:opacity-70 transition-opacity"
                >
                  + 添加书籍
                </Link>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
