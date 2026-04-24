import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native'
import { supabase } from '../../services/supabase'
import CameraScreen from '../../screens/CameraScreen'
import { detectIngredients } from '../../services/visionService'
import RecipeCard from '../../components/RecipeCard'

type Recipe = {
  title: string
  image: string
  used: string[]
  missing: string[]
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [ingredients, setIngredients] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(true)

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  async function handleImageCaptured(base64: string) {
    setLoading(true)
    setRecipes([])
    setShowCamera(false)

    try {
      const result = await detectIngredients(base64)
      setIngredients(result.ingredients)
      setRecipes(result.recipes)
    } catch (error: any) {
      console.log('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveRecipe(recipe: Recipe) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('saved_recipes').insert({
      user_id: user.id,
      title: recipe.title,
      image: recipe.image,
      used: recipe.used.join(','),
      missing: recipe.missing.join(','),
    })

    if (error) {
      console.log('Error guardando:', error)
    } else {
      alert('Receta guardada ✅')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>App Recetas</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Salir</Text>
        </TouchableOpacity>
      </View>

      {showCamera ? (
        <CameraScreen onImageCaptured={handleImageCaptured} />
      ) : (
        <View style={styles.content}>
          <TouchableOpacity style={styles.retryButton} onPress={() => setShowCamera(true)}>
            <Text style={styles.retryText}>📷 Tomar otra foto</Text>
          </TouchableOpacity>

          {ingredients && (
            <Text style={styles.ingredientsText}>🥕 Ingredientes: {ingredients}</Text>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2d6a4f" />
              <Text style={styles.loadingText}>Buscando recetas...</Text>
            </View>
          )}

          {!loading && recipes.length === 0 && (
            <Text style={styles.emptyText}>No se encontraron recetas. Intentá con otros ingredientes.</Text>
          )}

          <FlatList
            data={recipes}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <RecipeCard
                recipe={item}
                onSave={() => handleSaveRecipe(item)}
              />
            )}
            contentContainerStyle={styles.list}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2d6a4f' },
  logout: { color: '#e63946', fontSize: 16 },
  content: { flex: 1, padding: 16 },
  retryButton: { backgroundColor: '#f0f7f4', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  retryText: { color: '#2d6a4f', fontWeight: 'bold', fontSize: 15 },
  ingredientsText: { fontSize: 13, color: '#555', marginBottom: 12 },
  loadingContainer: { alignItems: 'center', padding: 32 },
  loadingText: { color: '#2d6a4f', marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 32, fontSize: 15 },
  list: { paddingBottom: 32 },
})