export interface BookSearchResult {
  title: string
  author: string
  coverUrl: string | null
  id: string // Google Books volume ID
}

interface GoogleBooksVolume {
  id?: string
  volumeInfo?: {
    title?: string
    authors?: string[]
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
  }
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[]
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  if (!apiKey) return []

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books&key=${apiKey}`
    const response = await fetch(url)
    const data: GoogleBooksResponse = await response.json()

    if (!data.items || data.items.length === 0) {
      return []
    }

    return data.items
      .filter((item) => item.volumeInfo?.title)
      .map((item) => {
        const info = item.volumeInfo!
        // Use https to avoid mixed content; Google returns http thumbnails
        const thumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null
        const coverUrl = thumbnail ? thumbnail.replace('http://', 'https://') : null

        return {
          title: info.title ?? '',
          author: info.authors?.[0] ?? '',
          coverUrl,
          id: item.id ?? '',
        }
      })
  } catch {
    return []
  }
}
