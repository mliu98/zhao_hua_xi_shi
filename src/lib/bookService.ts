import { supabase } from './supabaseClient'
import { uploadImage } from './storageService'
import type { Book } from './types'

export interface BookData {
  title: string
  author: string
  coverUrl?: string | null
  coverFile?: File
  readingNotes?: string
  readDate?: string | null
}

const BOOK_SELECT = `*, quotes:book_quotes(*), memory_books(memory:memories(date)), location:locations(*)`

export async function getAllBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as any[]).map(normalizeBook) as Book[]
}

export async function getBookById(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return normalizeBook(data) as Book
}

export async function getLinkedMemories(bookId: string) {
  const { data, error } = await supabase
    .from('memory_books')
    .select('memory_id, memory:memories(id, date, location:locations(name))')
    .eq('book_id', bookId)

  if (error) return []
  return (data ?? []) as { memory_id: string; memory: { id: string; date: string; location: { name: string } | null } }[]
}

export async function createBook(bookData: BookData, quotes: string[]): Promise<Book> {
  const { data: book, error } = await supabase
    .from('books')
    .insert({
      title: bookData.title,
      author: bookData.author,
      cover_url: bookData.coverUrl ?? null,
      reading_notes: bookData.readingNotes || null,
      read_date: bookData.readDate || null,
    })
    .select()
    .single()

  if (error) throw error

  let coverUrl = bookData.coverUrl ?? null
  if (bookData.coverFile) {
    const path = `books/${book.id}-cover-${bookData.coverFile.name.replace(/\s+/g, '_')}`
    coverUrl = await uploadImage(bookData.coverFile, path)
    await supabase.from('books').update({ cover_url: coverUrl }).eq('id', book.id)
  }

  if (quotes.length > 0) {
    const { error: qErr } = await supabase
      .from('book_quotes')
      .insert(quotes.map((content, i) => ({ book_id: book.id, content, order: i })))
    if (qErr) throw qErr
  }

  return {
    ...book,
    cover_url: coverUrl,
    quotes: quotes.map((content, i) => ({ id: '', book_id: book.id, content, order: i })),
    memoryDates: [],
  } as Book
}

export async function deleteBook(id: string): Promise<void> {
  // Delete linked memories first (memory_books cascade-deletes when memory is deleted)
  const { data: links } = await supabase
    .from('memory_books')
    .select('memory_id')
    .eq('book_id', id)

  if (links && links.length > 0) {
    const memoryIds = links.map((l: any) => l.memory_id)
    await supabase.from('memories').delete().in('id', memoryIds)
  }

  // Delete the book (cascades to book_quotes and any remaining memory_books)
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}

export async function updateBook(id: string, bookData: BookData, quotes: string[]): Promise<void> {
  let coverUrl = bookData.coverUrl ?? null
  if (bookData.coverFile) {
    const path = `books/${id}-cover-${Date.now()}-${bookData.coverFile.name.replace(/\s+/g, '_')}`
    coverUrl = await uploadImage(bookData.coverFile, path)
  }

  const { error } = await supabase.from('books').update({
    title: bookData.title,
    author: bookData.author,
    cover_url: coverUrl,
    reading_notes: bookData.readingNotes || null,
    read_date: bookData.readDate !== undefined ? (bookData.readDate || null) : undefined,
  }).eq('id', id)
  if (error) throw error

  await supabase.from('book_quotes').delete().eq('book_id', id)
  if (quotes.length > 0) {
    const { error: qErr } = await supabase
      .from('book_quotes')
      .insert(quotes.map((content, i) => ({ book_id: id, content, order: i })))
    if (qErr) throw qErr
  }
}

// Returns the years a book belongs to for shelf filtering
export function bookYears(book: Book): number[] {
  if (book.read_date) {
    return [yearOf(book.read_date)]
  }
  const years = (book.memoryDates ?? []).map(yearOf)
  return [...new Set(years)]
}

// Returns all years that have at least one book, sorted descending
export function getAvailableYears(books: Book[]): number[] {
  const set = new Set<number>()
  for (const b of books) {
    for (const y of bookYears(b)) set.add(y)
  }
  return [...set].sort((a, b) => b - a)
}

// Filter books belonging to a given year
export function getBooksForYear(books: Book[], year: number): Book[] {
  return books.filter((b) => bookYears(b).includes(year))
}

function yearOf(dateStr: string): number {
  return parseInt(dateStr.slice(0, 4), 10)
}

export async function updateBookLocation(bookId: string, locationId: string | null): Promise<void> {
  const { error } = await supabase.from('books').update({ location_id: locationId }).eq('id', bookId)
  if (error) throw error
}

export async function getBooksByLocationIds(locationIds: string[]): Promise<Book[]> {
  if (locationIds.length === 0) return []
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_SELECT)
    .in('location_id', locationIds)
  if (error) throw error
  return (data as any[]).map(normalizeBook) as Book[]
}

function normalizeBook(raw: any): Book {
  const quotes = Array.isArray(raw.quotes) ? raw.quotes.sort((a: any, b: any) => a.order - b.order) : []
  const memoryDates = Array.isArray(raw.memory_books)
    ? raw.memory_books.map((mb: any) => mb.memory?.date).filter(Boolean) as string[]
    : []
  const location = raw.location ?? undefined
  return { ...raw, quotes, memoryDates, location, memory_books: undefined }
}
