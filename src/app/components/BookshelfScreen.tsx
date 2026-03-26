import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllBooks, getAvailableYears, getBooksForYear } from '../../lib/bookService';
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

function spineHeight(title: string): number {
  return Math.min(235, Math.max(185, 165 + title.length * 3));
}

function BookSpine({ book, index }: { book: Book; index: number }) {
  const color = spineColor(book.id);
  const height = spineHeight(book.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.5 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      style={{ display: 'inline-block', alignSelf: 'flex-end' }}
    >
      <Link to={`/book/${book.id}`} style={{ textDecoration: 'none' }}>
        <div
          style={{
            width: '48px',
            height: `${height}px`,
            background: color,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 0',
            cursor: 'pointer',
            boxShadow: '2px 0 6px rgba(0,0,0,0.18), inset -1px 0 0 rgba(255,255,255,0.06)',
          }}
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              color: 'rgba(255,255,255,0.88)',
              fontSize: '0.75rem',
              letterSpacing: '0.02em',
              fontFamily: 'var(--font-serif)',
              maxHeight: `${height - 50}px`,
              overflow: 'hidden',
              lineHeight: 1.2,
            }}
          >
            {book.title}
          </span>
          <span
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.6rem',
              letterSpacing: '0.01em',
              fontFamily: 'var(--font-serif)',
              maxHeight: '48px',
              overflow: 'hidden',
              lineHeight: 1.2,
            }}
          >
            {book.author}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function YearNavigator({
  years,
  selected,
  onChange,
}: {
  years: number[];
  selected: number;
  onChange: (y: number) => void;
}) {
  const idx = years.indexOf(selected);
  const canPrev = idx < years.length - 1; // years sorted descending
  const canNext = idx > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-serif)' }}>
      <button
        onClick={() => canPrev && onChange(years[idx + 1])}
        disabled={!canPrev}
        style={{ background: 'none', border: 'none', cursor: canPrev ? 'pointer' : 'default', padding: '4px', color: canPrev ? 'var(--ink-light)' : 'var(--ink-faint)', opacity: canPrev ? 1 : 0.3, display: 'flex', alignItems: 'center' }}
      >
        <ChevronLeft size={14} />
      </button>
      <span style={{ color: 'var(--ink-text)', fontSize: '0.875rem', minWidth: '36px', textAlign: 'center' }}>
        {selected}
      </span>
      <button
        onClick={() => canNext && onChange(years[idx - 1])}
        disabled={!canNext}
        style={{ background: 'none', border: 'none', cursor: canNext ? 'pointer' : 'default', padding: '4px', color: canNext ? 'var(--ink-light)' : 'var(--ink-faint)', opacity: canNext ? 1 : 0.3, display: 'flex', alignItems: 'center' }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export function BookshelfScreen() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllBooks().then((books) => {
      setAllBooks(books);
      const years = getAvailableYears(books);
      setAvailableYears(years);
      if (years.length > 0) {
        const currentYear = new Date().getFullYear();
        setSelectedYear(years.includes(currentYear) ? currentYear : years[0]);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const booksThisYear = getBooksForYear(allBooks, selectedYear);

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
          {allBooks.length === 0 ? (
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
              {/* Year navigator */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                {availableYears.length > 0 && (
                  <YearNavigator
                    years={availableYears}
                    selected={selectedYear}
                    onChange={setSelectedYear}
                  />
                )}
              </div>

              {/* Shelf */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '3px',
                    alignItems: 'flex-end',
                    paddingBottom: '12px',
                    minHeight: '248px',
                  }}
                >
                  {booksThisYear.map((book, i) => (
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
