import { describe, it, expect } from 'vitest'
import { parseGoodreadsRss, filterNewBooks, normalizeDate } from './goodreadsRssParser'

const makeItem = (fields: Record<string, string>) => {
  const entries = Object.entries(fields)
    .map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`)
    .join('\n')
  return `<item>\n${entries}\n</item>`
}

const makeRss = (items: string[]) =>
  `<rss><channel>${items.join('')}</channel></rss>`

describe('parseGoodreadsRss', () => {
  it('parses basic fields correctly', () => {
    const xml = makeRss([
      makeItem({
        book_id: '12345',
        title: 'The Kite Runner',
        author_name: 'Khaled Hosseini',
        book_image_url: 'https://example.com/cover.jpg',
        user_date_read: 'Jan 15, 2024',
        user_review: '<p>Great book</p>',
        book_description: 'A story set in Kabul.',
      }),
    ])

    const books = parseGoodreadsRss(xml)
    expect(books).toHaveLength(1)
    expect(books[0].goodreads_id).toBe('12345')
    expect(books[0].title).toBe('The Kite Runner')
    expect(books[0].author).toBe('Khaled Hosseini')
    expect(books[0].cover_url).toBe('https://example.com/cover.jpg')
    expect(books[0].date_read).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(books[0].reading_notes).toBe('Great book')
    expect(books[0].description).toBe('A story set in Kabul.')
  })

  it('defaults date_read to today when missing', () => {
    const today = new Date().toISOString().slice(0, 10)
    const xml = makeRss([
      makeItem({ book_id: '1', title: 'No Date Book', author_name: 'Author' }),
    ])
    expect(parseGoodreadsRss(xml)[0].date_read).toBe(today)
  })

  it('sets reading_notes to null when review is empty', () => {
    const xml = makeRss([
      makeItem({ book_id: '2', title: 'Silent Book', author_name: 'Author', user_review: '' }),
    ])
    expect(parseGoodreadsRss(xml)[0].reading_notes).toBeNull()
  })

  it('strips HTML tags from reading_notes', () => {
    const xml = makeRss([
      makeItem({ book_id: '3', title: 'Tagged', author_name: 'Author', user_review: '<b>Bold</b> review' }),
    ])
    expect(parseGoodreadsRss(xml)[0].reading_notes).toBe('Bold review')
  })

  it('returns empty array for empty RSS', () => {
    expect(parseGoodreadsRss('<rss><channel></channel></rss>')).toHaveLength(0)
  })

  it('skips items without book_id or title', () => {
    const xml = makeRss([
      makeItem({ author_name: 'Nobody' }),
      makeItem({ book_id: '99', title: 'Valid Book', author_name: 'Author' }),
    ])
    const books = parseGoodreadsRss(xml)
    expect(books).toHaveLength(1)
    expect(books[0].goodreads_id).toBe('99')
  })

  it('parses multiple books', () => {
    const xml = makeRss([
      makeItem({ book_id: '1', title: 'Book One', author_name: 'Author A' }),
      makeItem({ book_id: '2', title: 'Book Two', author_name: 'Author B' }),
      makeItem({ book_id: '3', title: 'Book Three', author_name: 'Author C' }),
    ])
    expect(parseGoodreadsRss(xml)).toHaveLength(3)
  })

  it('decodes HTML entities in title and author', () => {
    const xml = makeRss([
      makeItem({ book_id: '5', title: 'Catch &amp; Release', author_name: 'O&#39;Brien' }),
    ])
    const books = parseGoodreadsRss(xml)
    expect(books[0].title).toBe('Catch & Release')
    expect(books[0].author).toBe("O'Brien")
  })
})

describe('filterNewBooks', () => {
  const books = [
    { goodreads_id: 'a', title: 'A', author: '', cover_url: '', date_read: '2024-01-01', reading_notes: null, description: '' },
    { goodreads_id: 'b', title: 'B', author: '', cover_url: '', date_read: '2024-01-01', reading_notes: null, description: '' },
    { goodreads_id: 'c', title: 'C', author: '', cover_url: '', date_read: '2024-01-01', reading_notes: null, description: '' },
  ]

  it('filters out books with existing goodreads_ids', () => {
    const result = filterNewBooks(books, new Set(['a', 'c']))
    expect(result).toHaveLength(1)
    expect(result[0].goodreads_id).toBe('b')
  })

  it('returns all books when no existing ids', () => {
    expect(filterNewBooks(books, new Set())).toHaveLength(3)
  })

  it('returns empty when all already imported', () => {
    expect(filterNewBooks(books, new Set(['a', 'b', 'c']))).toHaveLength(0)
  })
})

describe('normalizeDate', () => {
  it('returns today for null input', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(normalizeDate(null)).toBe(today)
  })

  it('parses "Jan 15, 2024" format', () => {
    expect(normalizeDate('Jan 15, 2024')).toBe('2024-01-15')
  })

  it('returns today for unparseable input', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(normalizeDate('not-a-date')).toBe(today)
  })
})
