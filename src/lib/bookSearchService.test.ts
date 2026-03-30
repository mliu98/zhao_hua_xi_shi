import { describe, it, expect, vi } from 'vitest'
import { searchBooks } from './bookSearchService'

describe('searchBooks', () => {
  it('returns mapped results for a normal response', async () => {
    const mockResponse = {
      items: [
        {
          id: 'abc123',
          volumeInfo: {
            title: 'The Great Gatsby',
            authors: ['F. Scott Fitzgerald'],
            imageLinks: { thumbnail: 'http://books.google.com/thumbnail/abc123' },
          },
        },
        {
          id: 'def456',
          volumeInfo: {
            title: '挪威的森林',
            authors: ['村上春树'],
            imageLinks: undefined,
          },
        },
      ],
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(mockResponse) }))

    const results = await searchBooks('gatsby')

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      coverUrl: 'https://books.google.com/thumbnail/abc123', // http → https
      id: 'abc123',
    })
    expect(results[1]).toEqual({
      title: '挪威的森林',
      author: '村上春树',
      coverUrl: null,
      id: 'def456',
    })

    vi.unstubAllGlobals()
  })

  it('returns empty array when items is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({ items: [] }) }))

    const results = await searchBooks('xyznonexistent')
    expect(results).toEqual([])

    vi.unstubAllGlobals()
  })

  it('returns empty array when items is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({}) }))

    const results = await searchBooks('zzzzzzzzzzzzz')
    expect(results).toEqual([])

    vi.unstubAllGlobals()
  })

  it('returns empty array when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const results = await searchBooks('anything')
    expect(results).toEqual([])

    vi.unstubAllGlobals()
  })
})
