import { supabase } from './supabase'

export async function getShoppingList(userId: string) {
  const { data, error } = await supabase
    .from('shopping_list')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) return []
  return data
}

export async function addIngredients(userId: string, ingredients: string[]) {
  const { data: existing } = await supabase
    .from('shopping_list')
    .select('ingredient')
    .eq('user_id', userId)

  const existingNames = existing?.map(i => i.ingredient.toLowerCase()) ?? []
  const newIngredients = ingredients.filter(i => !existingNames.includes(i.toLowerCase()))

  if (newIngredients.length === 0) return

  await supabase.from('shopping_list').insert(
    newIngredients.map(ingredient => ({ user_id: userId, ingredient }))
  )
}

export async function toggleIngredient(id: string, checked: boolean) {
  await supabase.from('shopping_list').update({ checked }).eq('id', id)
}

export async function deleteIngredient(id: string) {
  await supabase.from('shopping_list').delete().eq('id', id)
}

export async function clearShoppingList(userId: string) {
  await supabase.from('shopping_list').delete().eq('user_id', userId)
}