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

export interface PhotoImage {
  id: string
  memory_id: string
  image_url: string
  order: number
}

export interface NoteImage {
  id: string
  memory_id: string
  image_url: string
  order: number
}

export interface MemoryPhoto {
  memory_id: string
  caption: string | null
  images: PhotoImage[]
}

export interface MemoryNote {
  memory_id: string
  note_type: 'handwritten' | 'text'
  content: string | null
  images: NoteImage[]
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
