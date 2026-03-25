import { supabase } from './supabaseClient'
import { uploadImage } from './storageService'
import type { Memory } from './types'

export interface BookData {
  title: string
  author: string
  coverUrl?: string | null
  coverFile?: File
  readingNotes?: string
}

function normalizeMemory(raw: any) {
  const photo = Array.isArray(raw.photo) ? raw.photo[0] ?? null : raw.photo
  const note = Array.isArray(raw.note) ? raw.note[0] ?? null : raw.note
  const book = Array.isArray(raw.book) ? raw.book[0] ?? null : raw.book
  const quotes = Array.isArray(raw.quotes) ? raw.quotes : []
  const photoImages = Array.isArray(raw.photo_images) ? raw.photo_images : []
  const noteImages = Array.isArray(raw.note_images) ? raw.note_images : []

  return {
    ...raw,
    photo: photo ? { ...photo, images: photoImages } : null,
    note: note ? { ...note, images: noteImages } : null,
    book: book ? { ...book, quotes } : null,
    photo_images: undefined,
    note_images: undefined,
    quotes: undefined,
  }
}

const MEMORY_SELECT = `
  *,
  photo:memory_photos(*),
  photo_images(order, image_url, id),
  note:memory_notes(*),
  note_images(order, image_url, id),
  book:memory_books(*),
  quotes:book_quotes(*)
`

export async function getMemoriesByLocation(locationId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select(MEMORY_SELECT)
    .eq('location_id', locationId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data as any[]).map(normalizeMemory) as Memory[]
}

export async function getAllMemories(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select(`${MEMORY_SELECT}, location:locations(name)`)
    .order('date', { ascending: false })

  if (error) throw error
  return (data as any[]).map(normalizeMemory) as Memory[]
}

export async function getMemoryById(id: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('memories')
    .select(`${MEMORY_SELECT}, location:locations(name)`)
    .eq('id', id)
    .single()

  if (error) return null
  return normalizeMemory(data) as Memory
}

export async function createPhotoMemory(
  locationId: string,
  date: string,
  imageFiles: File[],
  caption?: string
): Promise<Memory> {
  const { data: memory, error: memError } = await supabase
    .from('memories')
    .insert({ location_id: locationId, type: 'photo', date })
    .select()
    .single()

  if (memError) throw memError

  const { error: photoError } = await supabase
    .from('memory_photos')
    .insert({ memory_id: memory.id, caption: caption || null })

  if (photoError) throw photoError

  const uploadedImages = await Promise.all(
    imageFiles.map(async (file, i) => {
      const path = `photos/${memory.id}-${i}-${file.name.replace(/\s+/g, '_')}`
      const imageUrl = await uploadImage(file, path)
      return { memory_id: memory.id, image_url: imageUrl, order: i }
    })
  )

  const { error: imgError } = await supabase.from('photo_images').insert(uploadedImages)
  if (imgError) throw imgError

  return { ...memory, photo: { memory_id: memory.id, caption: caption || null, images: uploadedImages as any } } as Memory
}

export async function createNoteMemory(
  locationId: string,
  date: string,
  noteType: 'text' | 'handwritten',
  content?: string,
  imageFiles?: File[]
): Promise<Memory> {
  const { data: memory, error: memError } = await supabase
    .from('memories')
    .insert({ location_id: locationId, type: 'note', date })
    .select()
    .single()

  if (memError) throw memError

  const { error: noteError } = await supabase
    .from('memory_notes')
    .insert({ memory_id: memory.id, note_type: noteType, content: content || null })

  if (noteError) throw noteError

  let uploadedImages: any[] = []
  if (noteType === 'handwritten' && imageFiles && imageFiles.length > 0) {
    uploadedImages = await Promise.all(
      imageFiles.map(async (file, i) => {
        const path = `notes/${memory.id}-${i}-${file.name.replace(/\s+/g, '_')}`
        const imageUrl = await uploadImage(file, path)
        return { memory_id: memory.id, image_url: imageUrl, order: i }
      })
    )
    const { error: imgError } = await supabase.from('note_images').insert(uploadedImages)
    if (imgError) throw imgError
  }

  return { ...memory, note: { memory_id: memory.id, note_type: noteType, content: content || null, images: uploadedImages } } as Memory
}

export async function createBookMemory(
  locationId: string,
  date: string,
  book: BookData,
  quotes: string[]
): Promise<Memory> {
  const { data: memory, error: memError } = await supabase
    .from('memories')
    .insert({ location_id: locationId, type: 'book', date })
    .select()
    .single()

  if (memError) throw memError

  let coverUrl = book.coverUrl ?? null
  if (book.coverFile) {
    const path = `books/${memory.id}-cover-${book.coverFile.name.replace(/\s+/g, '_')}`
    coverUrl = await uploadImage(book.coverFile, path)
  }

  const { error: bookError } = await supabase
    .from('memory_books')
    .insert({ memory_id: memory.id, title: book.title, author: book.author, cover_url: coverUrl, reading_notes: book.readingNotes || null })

  if (bookError) throw bookError

  if (quotes.length > 0) {
    const { error: quotesError } = await supabase
      .from('book_quotes')
      .insert(quotes.map((content, i) => ({ memory_id: memory.id, content, order: i })))

    if (quotesError) throw quotesError
  }

  return {
    ...memory,
    book: { memory_id: memory.id, title: book.title, author: book.author, cover_url: coverUrl, reading_notes: book.readingNotes || null, quotes: quotes.map((content, i) => ({ id: '', memory_id: memory.id, content, order: i })) }
  } as Memory
}

export async function updatePhotoMemory(
  memoryId: string,
  date: string,
  caption: string | undefined,
  newImageFiles: File[],
  removeImageIds: string[]
): Promise<void> {
  const { error: memError } = await supabase.from('memories').update({ date }).eq('id', memoryId)
  if (memError) throw memError

  const { error: photoError } = await supabase.from('memory_photos').update({ caption: caption || null }).eq('memory_id', memoryId)
  if (photoError) throw photoError

  if (removeImageIds.length > 0) {
    const { error } = await supabase.from('photo_images').delete().in('id', removeImageIds)
    if (error) throw error
  }

  if (newImageFiles.length > 0) {
    const { data: existing } = await supabase.from('photo_images').select('order').eq('memory_id', memoryId).order('order', { ascending: false }).limit(1)
    const nextOrder = existing?.[0] ? (existing[0] as any).order + 1 : 0
    const uploaded = await Promise.all(
      newImageFiles.map(async (file, i) => {
        const path = `photos/${memoryId}-${Date.now()}-${i}-${file.name.replace(/\s+/g, '_')}`
        const imageUrl = await uploadImage(file, path)
        return { memory_id: memoryId, image_url: imageUrl, order: nextOrder + i }
      })
    )
    const { error } = await supabase.from('photo_images').insert(uploaded)
    if (error) throw error
  }
}

export async function updateNoteMemory(
  memoryId: string,
  date: string,
  content: string | undefined,
  newImageFiles: File[],
  removeImageIds: string[]
): Promise<void> {
  const { error: memError } = await supabase.from('memories').update({ date }).eq('id', memoryId)
  if (memError) throw memError

  const { error: noteError } = await supabase.from('memory_notes').update({ content: content || null }).eq('memory_id', memoryId)
  if (noteError) throw noteError

  if (removeImageIds.length > 0) {
    const { error } = await supabase.from('note_images').delete().in('id', removeImageIds)
    if (error) throw error
  }

  if (newImageFiles.length > 0) {
    const { data: existing } = await supabase.from('note_images').select('order').eq('memory_id', memoryId).order('order', { ascending: false }).limit(1)
    const nextOrder = existing?.[0] ? (existing[0] as any).order + 1 : 0
    const uploaded = await Promise.all(
      newImageFiles.map(async (file, i) => {
        const path = `notes/${memoryId}-${Date.now()}-${i}-${file.name.replace(/\s+/g, '_')}`
        const imageUrl = await uploadImage(file, path)
        return { memory_id: memoryId, image_url: imageUrl, order: nextOrder + i }
      })
    )
    const { error } = await supabase.from('note_images').insert(uploaded)
    if (error) throw error
  }
}

export async function updateBookMemory(
  memoryId: string,
  date: string,
  book: BookData,
  quotes: string[]
): Promise<void> {
  const { error: memError } = await supabase.from('memories').update({ date }).eq('id', memoryId)
  if (memError) throw memError

  let coverUrl = book.coverUrl ?? null
  if (book.coverFile) {
    const path = `books/${memoryId}-cover-${Date.now()}-${book.coverFile.name.replace(/\s+/g, '_')}`
    coverUrl = await uploadImage(book.coverFile, path)
  }

  const { error: bookError } = await supabase.from('memory_books').update({
    title: book.title, author: book.author, cover_url: coverUrl, reading_notes: book.readingNotes || null
  }).eq('memory_id', memoryId)
  if (bookError) throw bookError

  // Replace all quotes
  await supabase.from('book_quotes').delete().eq('memory_id', memoryId)
  if (quotes.length > 0) {
    const { error } = await supabase.from('book_quotes').insert(quotes.map((content, i) => ({ memory_id: memoryId, content, order: i })))
    if (error) throw error
  }
}
