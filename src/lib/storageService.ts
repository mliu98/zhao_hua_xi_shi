import { supabase } from './supabaseClient'

export async function uploadImage(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage
    .from('memory-images')
    .upload(path, file, { upsert: false })

  if (error) throw error

  const { data } = supabase.storage
    .from('memory-images')
    .getPublicUrl(path)

  return data.publicUrl
}
