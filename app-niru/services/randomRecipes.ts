import { supabase } from './supabase'

export async function getOrFetchRandomRecipes(userId: string) {
  const { data } = await supabase
    .from('random_recipes')
    .select('recipes')
    .eq('user_id', userId)
    .single()

  if (data?.recipes) return data.recipes

  const { data: result, error } = await supabase.functions.invoke('get-recipes', {
    body: { action: 'random' }
  })

  if (error || !result?.recipes) return []

  await supabase.from('random_recipes').insert({
    user_id: userId,
    recipes: result.recipes,
  })

  return result.recipes
}