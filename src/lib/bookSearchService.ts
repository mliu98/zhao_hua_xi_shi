export interface BookSearchResult {
  title: string
  author: string
  coverUrl: string | null
  olid: string // Open Library work ID, e.g. "OL45804W"
}

interface OpenLibraryDoc {
  title?: string
  author_name?: string[]
  cover_i?: number
  key?: string
}

interface OpenLibraryResponse {
  docs?: OpenLibraryDoc[]
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=title,author_name,cover_i,key`
    const response = await fetch(url)
    const data: OpenLibraryResponse = await response.json()

    if (!data.docs || data.docs.length === 0) {
      return []
    }

    return data.docs.map((doc) => {
      const coverUrl = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : null

      const olid = doc.key ? doc.key.replace('/works/', '') : ''

      return {
        title: doc.title ?? '',
        author: doc.author_name?.[0] ?? '',
        coverUrl,
        olid,
      }
    })
  } catch {
    return []
  }
}
