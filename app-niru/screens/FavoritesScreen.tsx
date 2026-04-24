import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../services/supabase'
import RecipeDetailScreen from './RecipeDetailScreen'

type SavedRecipe = {
  id: string
  recipe_id: number
  title: string
  image: string
  used: string
  missing: string
}

export default function FavoritesScreen() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null)

  useFocusEffect(
    useCallback(() => {
      fetchFavorites()
    }, [])
  )

async function fetchFavorites() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No hay usuario')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('data:', JSON.stringify(data))
    console.log('error:', JSON.stringify(error))

    if (!error && data) setRecipes(data)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('id', id)

    if (!error) setRecipes(prev => prev.filter(r => r.id !== id))
  }

  if (selectedRecipe) {
    return (
      <RecipeDetailScreen
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
      />
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>❤️ Mis Recetas Guardadas</Text>

      {loading && <ActivityIndicator size="large" color="#2d6a4f" />}

      {!loading && recipes.length === 0 && (
        <Text style={styles.empty}>No tenés recetas guardadas todavía.</Text>
      )}

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedRecipe({
            id: item.recipe_id,
            title: item.title,
            image: item.image,
            used: item.used.split(','),
            missing: item.missing.split(','),
          })}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.recipeTitle}>{item.title}</Text>
              <Text style={styles.label}>✅ Tenés: <Text style={styles.used}>{item.used}</Text></Text>
              <Text style={styles.label}>❌ Te falta: <Text style={styles.missing}>{item.missing}</Text></Text>
              <TouchableOpacity style={styles.deleteButton} onPress={(e) => { e.stopPropagation(); handleDelete(item.id) }}>
                <Text style={styles.deleteText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2d6a4f', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#888', marginTop: 32, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  image: { width: '100%', height: 160 },
  info: { padding: 16 },
  recipeTitle: { fontSize: 16, fontWeight: 'bold', color: '#2d6a4f', marginBottom: 8 },
  label: { fontSize: 13, color: '#333', marginBottom: 4 },
  used: { color: '#2d6a4f' },
  missing: { color: '#e63946' },
  deleteButton: { marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e63946', padding: 10, borderRadius: 8, alignItems: 'center' },
  deleteText: { color: '#e63946', fontWeight: 'bold' },
  list: { paddingBottom: 32 },
})