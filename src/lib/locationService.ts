import { supabase } from './supabaseClient'
import type { Location, NominatimResult } from './types'

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createLocation(
  name: string,
  lat: number,
  lng: number,
  parentId?: string | null
): Promise<Location> {
  const { data, error } = await supabase
    .from('locations')
    .insert({ name, lat, lng, parent_id: parentId ?? null })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getLocationById(id: string): Promise<Location | null> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function updateLocationParent(
  locationId: string,
  parentId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .update({ parent_id: parentId })
    .eq('id', locationId)
  if (error) throw error
}

// --- Client-side tree helpers (operate on the flat locations array) ---

/** Returns ancestors ordered from root → direct parent */
export function getAncestors(allLocations: Location[], locationId: string): Location[] {
  const locMap = new Map(allLocations.map((l) => [l.id, l]))
  const ancestors: Location[] = []
  let current = locMap.get(locationId)
  while (current?.parent_id) {
    const parent = locMap.get(current.parent_id)
    if (!parent) break
    ancestors.unshift(parent)
    current = parent
  }
  return ancestors
}

/** Returns immediate children of a location */
export function getChildren(allLocations: Location[], parentId: string): Location[] {
  return allLocations.filter((l) => l.parent_id === parentId)
}

/** Returns all descendant IDs (not including rootId itself) via BFS */
export function getDescendantIds(allLocations: Location[], rootId: string): string[] {
  const ids: string[] = []
  const queue = [rootId]
  while (queue.length) {
    const current = queue.shift()!
    for (const loc of allLocations) {
      if (loc.parent_id === current) {
        ids.push(loc.id)
        queue.push(loc.id)
      }
    }
  }
  return ids
}

/** Given a Nominatim displayName like "San Francisco, California, United States",
 *  returns the first existing location in DB that matches any component (skipping index 0). */
export function suggestParentFromDisplayName(
  displayName: string,
  locations: Location[]
): Location | null {
  const parts = displayName.split(',').map((p) => p.trim())
  for (let i = 1; i < parts.length; i++) {
    const match = locations.find(
      (l) => l.name.toLowerCase() === parts[i].toLowerCase()
    )
    if (match) return match
  }
  return null
}

export async function searchByName(query: string): Promise<NominatimResult[]> {
  if (!query.trim()) return []

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
    { headers: { 'User-Agent': 'ZhaoHuaXiShi/1.0' } }
  )

  if (!response.ok) return []

  const results = await response.json()
  return results.map((r: Record<string, string>) => ({
    name: r.name || r.display_name.split(',')[0],
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    displayName: r.display_name,
  }))
}
