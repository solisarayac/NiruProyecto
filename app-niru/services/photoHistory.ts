import { supabase } from './supabase'

function decode(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function savePhotoToHistory(
  userId: string,
  base64: string,
  ingredients: string
): Promise<string | null> {
  const filename = `${userId}/${Date.now()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('photo-history')
    .upload(filename, decode(base64), {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    console.log('Error subiendo foto:', uploadError)
    return null
  }

  const { data } = supabase.storage.from('photo-history').getPublicUrl(filename)
  const photoUrl = data.publicUrl

  const { error: dbError } = await supabase.from('photo_history').insert({
    user_id: userId,
    photo_url: photoUrl,
    ingredients,
  })

  if (dbError) {
    console.log('Error guardando historial:', dbError)
    return null
  }

  return photoUrl
}

export async function getPhotoHistory(userId: string) {
  const { data, error } = await supabase
    .from('photo_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function deletePhotoFromHistory(id: string, photoUrl: string) {
  const filename = photoUrl.split('/photo-history/')[1]

  await supabase.storage.from('photo-history').remove([filename])

  const { error } = await supabase
    .from('photo_history')
    .delete()
    .eq('id', id)

  return !error
}