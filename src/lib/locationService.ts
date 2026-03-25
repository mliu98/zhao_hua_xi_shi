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

export async function createLocation(name: string, lat: number, lng: number): Promise<Location> {
  const { data, error } = await supabase
    .from('locations')
    .insert({ name, lat, lng })
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
