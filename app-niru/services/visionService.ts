import { supabase } from './supabase'

export async function detectIngredients(base64?: string, ingredients?: string): Promise<{ ingredients: string, recipes: any[] }> {
  const body = base64 ? { base64 } : { action: 'findByIngredients', ingredients }

  const { data, error } = await supabase.functions.invoke('get-recipes', {
    body,
  })

  if (error) throw error
  return data
}