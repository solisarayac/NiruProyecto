import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../services/supabase'
import RecipeCard from '../components/RecipeCard'
import RecipeDetailScreen from './RecipeDetailScreen'
import { Colors, Spacing, Typography } from '../constants/theme'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

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

  const { toast, showToast, hideToast } = useToast()

  useFocusEffect(
    useCallback(() => { fetchFavorites() }, [])
  )

  async function fetchFavorites() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setRecipes(data)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('saved_recipes').delete().eq('id', id)
    if (!error) {
      setRecipes(prev => prev.filter(r => r.id !== id))
      showToast('Receta eliminada', 'error')
    }
  }

  if (selectedRecipe) {
    return <RecipeDetailScreen recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroSub}>Tus recetas favoritas</Text>
        <Text style={styles.heroTitle}>A un simple click</Text>
      </View>

      {loading && <ActivityIndicator size="large" color={Colors.primary} />}

      {!loading && recipes.length === 0 && (
        <Text style={styles.empty}>No tenés recetas guardadas todavía.</Text>
      )}

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={{
              id: item.recipe_id,
              title: item.title,
              image: item.image,
              used: item.used.split(','),
              missing: item.missing.split(','),
            }}
            onPress={() => setSelectedRecipe({
              id: item.recipe_id,
              title: item.title,
              image: item.image,
              used: item.used.split(','),
              missing: item.missing.split(','),
            })}
            isSaved={true}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  hero: { padding: Spacing.lg, paddingTop: 60 },
  heroSub: { fontSize: 14, color: Colors.primary, textAlign: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: Colors.primary, textAlign: 'center', marginTop: 4 },
  empty: { textAlign: 'center', color: Colors.grayText, marginTop: 40, fontSize: 15 },
  list: { padding: Spacing.md, paddingBottom: 40 },
})