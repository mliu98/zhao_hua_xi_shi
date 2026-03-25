export interface Location {
  id: string
  name: string
  lat: number
  lng: number
  created_at: string
}

export interface Memory {
  id: string
  location_id: string
  type: 'photo' | 'note' | 'book'
  date: string
  created_at: string
  // joined from sub-tables
  photo?: MemoryPhoto
  note?: MemoryNote
  book?: MemoryBook & { quotes: BookQuote[] }
}

export interface MemoryPhoto {
  memory_id: string
  image_url: string
  caption: string | null
}

export interface MemoryNote {
  memory_id: string
  note_type: 'handwritten' | 'text'
  image_url: string | null
  content: string | null
}

export interface MemoryBook {
  memory_id: string
  title: string
  author: string
  cover_url: string | null
  reading_notes: string | null
}

export interface BookQuote {
  id: string
  memory_id: string
  content: string
  order: number
}

export interface NominatimResult {
  name: string
  lat: number
  lng: number
  displayName: string
}
