import { useCallback, useState } from 'react'
import { View, Text, FlatList } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../services/supabase'
import RecipeCard from '../components/RecipeCard'
import RecipeDetailScreen from './RecipeDetailScreen'
import { Spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import FavoritesSkeleton from '../components/skeletons/FavoritesSkeleton'

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

  const { Colors } = useTheme()
  const styles = getStyles(Colors)

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

  if (loading) {
    return <FavoritesSkeleton />
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroSub}>Tus recetas favoritas</Text>
        <Text style={styles.heroTitle}>A un simple click</Text>
      </View>

      {recipes.length === 0 && (
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
              used: item.used ? item.used.split(',') : [],
              missing: item.missing ? item.missing.split(',') : [],
            }}
            onPress={() => setSelectedRecipe({
              id: item.recipe_id,
              title: item.title,
              image: item.image,
              used: item.used ? item.used.split(',') : [],
              missing: item.missing ? item.missing.split(',') : [],
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

const getStyles = (Colors: any) => ({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { padding: Spacing.lg, paddingTop: 60 },
  heroSub: { fontSize: 14, color: Colors.primary, textAlign: 'center' as const },
  heroTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.primary, textAlign: 'center' as const, marginTop: 4 },
  empty: { textAlign: 'center' as const, color: Colors.grayText, marginTop: 40, fontSize: 15 },
  list: { padding: Spacing.md, paddingBottom: 40 },
})