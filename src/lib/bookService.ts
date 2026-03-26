import { supabase } from './supabaseClient'
import { uploadImage } from './storageService'
import type { Book } from './types'

export interface BookData {
  title: string
  author: string
  coverUrl?: string | null
  coverFile?: File
  readingNotes?: string
}

const BOOK_SELECT = `*, quotes:book_quotes(*)`

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
  } as Book
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

function normalizeBook(raw: any): Book {
  const quotes = Array.isArray(raw.quotes) ? raw.quotes.sort((a: any, b: any) => a.order - b.order) : []
  return { ...raw, quotes }
}
