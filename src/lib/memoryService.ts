import { supabase } from './supabaseClient'
import { uploadImage } from './storageService'
import type { Memory } from './types'

// Supabase returns one-to-one relations as arrays; unwrap them
function normalizeMemory(raw: any) {
  const book = Array.isArray(raw.book) ? raw.book[0] ?? null : raw.book
  const quotes = Array.isArray(raw.quotes) ? raw.quotes : []
  return {
    ...raw,
    photo: Array.isArray(raw.photo) ? raw.photo[0] ?? null : raw.photo,
    note: Array.isArray(raw.note) ? raw.note[0] ?? null : raw.note,
    book: book ? { ...book, quotes } : null,
    quotes: undefined,
  }
}

const MEMORY_SELECT = `
  *,
  photo:memory_photos(*),
  note:memory_notes(*),
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
  imageFile: File,
  caption?: string
): Promise<Memory> {
  const path = `photos/${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`
  const imageUrl = await uploadImage(imageFile, path)

  const { data: memory, error: memError } = await supabase
    .from('memories')
    .insert({ location_id: locationId, type: 'photo', date })
    .select()
    .single()

  if (memError) throw memError

  const { error: photoError } = await supabase
    .from('memory_photos')
    .insert({ memory_id: memory.id, image_url: imageUrl, caption: caption || null })

  if (photoError) throw photoError

  return {
    ...memory,
    photo: { memory_id: memory.id, image_url: imageUrl, caption: caption || null },
  } as Memory
}
