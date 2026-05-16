import { supabase } from './supabaseClient'
import { createLocation } from './locationService'
import type { Location } from './types'

export interface DetectedLocation {
  name: string
  lat: number
  lng: number
  isNew: boolean
  existingId?: string
}

export interface SyncPreviewBook {
  goodreads_id: string
  title: string
  author: string
  cover_url: string
  date_read: string
  reading_notes: string | null
  detectedLocation: DetectedLocation | null
}

export interface SyncPreviewItem extends SyncPreviewBook {
  skipped: boolean
  // user-overridden location (null = no location, undefined = use detectedLocation)
  overrideLocationId?: string | null
}

const STORAGE_KEY = 'goodreads_user_id'

export function getStoredGoodreadsUserId(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setStoredGoodreadsUserId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id)
}

export async function fetchGoodreadsPreview(goodreadsUserId: string): Promise<SyncPreviewBook[]> {
  const { data, error } = await supabase.functions.invoke('sync-goodreads', {
    body: { goodreadsUserId },
  })
  if (error) throw error
  return (data as { books: SyncPreviewBook[] }).books
}

export async function importBooks(
  items: SyncPreviewItem[],
  allLocations: Location[]
): Promise<{ booksImported: number; locationsCreated: number }> {
  const toImport = items.filter((item) => !item.skipped)
  if (toImport.length === 0) return { booksImported: 0, locationsCreated: 0 }

  // Collect new locations to create (deduplicated by name)
  const newLocationNames = new Map<string, DetectedLocation>()
  for (const item of toImport) {
    const loc = resolvedLocation(item)
    if (loc?.isNew) newLocationNames.set(loc.name, loc)
  }

  // Create new locations first, build name → id map
  const createdLocationIds = new Map<string, string>()
  for (const [name, loc] of newLocationNames) {
    const created = await createLocation(name, loc.lat, loc.lng)
    createdLocationIds.set(name, created.id)
  }

  // Build final location_id per item
  const resolveId = (item: SyncPreviewItem): string | null => {
    if (item.overrideLocationId !== undefined) return item.overrideLocationId
    const loc = item.detectedLocation
    if (!loc) return null
    if (loc.isNew) return createdLocationIds.get(loc.name) ?? null
    return loc.existingId ?? null
  }

  // Insert books
  const toInsert = toImport.map((item) => ({
    title: item.title,
    author: item.author,
    cover_url: item.cover_url || null,
    reading_notes: item.reading_notes,
    read_date: item.date_read,
    goodreads_id: item.goodreads_id,
    location_id: resolveId(item),
  }))

  const { data: insertedBooks, error: bookErr } = await supabase
    .from('books')
    .insert(toInsert)
    .select('id')
  if (bookErr) throw bookErr

  return { booksImported: (insertedBooks ?? []).length, locationsCreated: createdLocationIds.size }
}

function resolvedLocation(item: SyncPreviewItem): DetectedLocation | null {
  if (item.overrideLocationId !== undefined) return null
  return item.detectedLocation
}
