import { supabase } from './supabase'

export async function detectIngredients(base64: string): Promise<{ ingredients: string, recipes: any[] }> {
  const { data, error } = await supabase.functions.invoke('get-recipes', {
    body: { base64 },
  })

  if (error) throw error
  return data
}