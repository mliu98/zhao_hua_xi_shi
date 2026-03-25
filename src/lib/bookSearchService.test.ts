import { describe, it, expect, vi } from 'vitest'
import { searchBooks } from './bookSearchService'

describe('searchBooks', () => {
  it('returns mapped results for a normal response', async () => {
    const mockResponse = {
      docs: [
        {
          title: 'The Great Gatsby',
          author_name: ['F. Scott Fitzgerald'],
          cover_i: 12345,
          key: '/works/OL45804W',
        },
        {
          title: 'To Kill a Mockingbird',
          author_name: ['Harper Lee'],
          cover_i: undefined,
          key: '/works/OL2798819W',
        },
      ],
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })
    )

    const results = await searchBooks('gatsby')

    expect(results).toHaveLength(2)

    expect(results[0]).toEqual({
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      coverUrl: 'https://covers.openlibrary.org/b/id/12345-M.jpg',
      olid: 'OL45804W',
    })

    expect(results[1]).toEqual({
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      coverUrl: null,
      olid: 'OL2798819W',
    })

    vi.unstubAllGlobals()
  })

  it('returns empty array when docs is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ docs: [] }),
      })
    )

    const results = await searchBooks('xyznonexistent')

    expect(results).toEqual([])

    vi.unstubAllGlobals()
  })

  it('returns empty array for a nonexistent query without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ docs: [] }),
      })
    )

    let results: Awaited<ReturnType<typeof searchBooks>> | undefined
    let error: unknown

    try {
      results = await searchBooks('zzzzzzzzzzzzzzzzzzzzzzz')
    } catch (e) {
      error = e
    }

    expect(error).toBeUndefined()
    expect(results).toEqual([])

    vi.unstubAllGlobals()
  })

  it('returns empty array when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error'))
    )

    const results = await searchBooks('anything')

    expect(results).toEqual([])

    vi.unstubAllGlobals()
  })
})
