import { useEffect, useState } from 'react'
import { View, Text, Image, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import { supabase } from '../services/supabase'
import { Spacing, Radius, Typography } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

type Step = { number: number; step: string }
type Recipe = { id: number; title: string; image: string; used: string[]; missing: string[] }

export default function RecipeDetailScreen({ recipe, onBack }: { recipe: Recipe; onBack: () => void }) {
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [nutrition, setNutrition] = useState<any | null>(null)
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [ingredients, setIngredients] = useState<any | null>(null)
  const [ingredientsLoading, setIngredientsLoading] = useState(false)

  const { Colors } = useTheme()
  const styles = getStyles(Colors)

  useEffect(() => { fetchInstructions() }, [])

  async function fetchInstructions() {
    try {
      const { data, error } = await supabase.functions.invoke('get-recipes', {
        body: { action: 'instructions', recipeId: recipe.id }
      })
      if (error) throw error
      if (data?.steps) setSteps(data.steps)
    } catch (error) {
      console.log('Error cargando instrucciones:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchIngredients() {
    setIngredientsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('get-recipes', {
        body: { action: 'ingredients', recipeId: recipe.id }
      })
      if (error) throw error
      if (data?.ingredients) setIngredients(data.ingredients)
    } catch (error) {
      console.log('Error cargando ingredientes:', error)
    } finally {
      setIngredientsLoading(false)
    }
  }

  async function fetchNutrition() {
    setNutritionLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('get-recipes', {
        body: { action: 'nutrition', recipeId: recipe.id }
      })
      if (error) throw error
      if (data?.nutrition) setNutrition(data.nutrition)
    } catch (error) {
      console.log('Error cargando nutrición:', error)
    } finally {
      setNutritionLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={steps}
        keyExtractor={(item) => item.number.toString()}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.imageContainer}>
              <Image source={{ uri: recipe.image }} style={styles.image} />
              <TouchableOpacity style={styles.closeButton} onPress={onBack}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{recipe.title}</Text>
              <Text style={styles.sectionTitle}>Preparación</Text>

              {!ingredients && !ingredientsLoading && (
                <TouchableOpacity style={styles.nutritionButton} onPress={fetchIngredients}>
                  <Text style={styles.nutritionButtonText}>🥘 Ver ingredientes completos</Text>
                </TouchableOpacity>
              )}

              {ingredientsLoading && (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
              )}

              {ingredients && (
                <View style={styles.ingredientsContainer}>
                  <Text style={styles.ingredientsTitle}>Ingredientes</Text>
                  <View style={styles.ingredientsList}>
                    {ingredients.used.map((ing: string, i: number) => (
                      <View key={i} style={styles.ingredientItem}>
                        <Text style={styles.ingredientDot}>•</Text>
                        <Text style={styles.ingredientText}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {!nutrition && !nutritionLoading && steps.length > 0 && (
                <TouchableOpacity style={styles.nutritionButton} onPress={fetchNutrition}>
                  <Text style={styles.nutritionButtonText}>🥗 Ver información nutricional</Text>
                </TouchableOpacity>
              )}

              {nutritionLoading && (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
              )}

              {nutrition && (
                <View style={styles.nutritionContainer}>
                  <Text style={styles.nutritionTitle}>Información nutricional</Text>
                  <View style={styles.nutritionRow}>
                    <View style={styles.nutritionCard}>
                      <Text style={styles.nutritionIcon}>🔥</Text>
                      <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                      <Text style={styles.nutritionLabel}>kcal</Text>
                    </View>
                    <View style={styles.nutritionCard}>
                      <Text style={styles.nutritionIcon}>💪</Text>
                      <Text style={styles.nutritionValue}>{nutrition.protein}</Text>
                      <Text style={styles.nutritionLabel}>Proteína</Text>
                    </View>
                    <View style={styles.nutritionCard}>
                      <Text style={styles.nutritionIcon}>🌾</Text>
                      <Text style={styles.nutritionValue}>{nutrition.carbs}</Text>
                      <Text style={styles.nutritionLabel}>Carbos</Text>
                    </View>
                    <View style={styles.nutritionCard}>
                      <Text style={styles.nutritionIcon}>🧈</Text>
                      <Text style={styles.nutritionValue}>{nutrition.fat}</Text>
                      <Text style={styles.nutritionLabel}>Grasas</Text>
                    </View>
                  </View>
                </View>
              )}

              {loading && <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.lg }} />}
              {!loading && steps.length === 0 && (
                <Text style={styles.noSteps}>No hay instrucciones disponibles para esta receta.</Text>
              )}
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.step}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>{item.number}</Text>
            </View>
            <Text style={styles.stepText}>{item.step}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const getStyles = (Colors: any) => ({
  container: { flex: 1, backgroundColor: Colors.background },
  imageContainer: { position: 'relative' as const },
  image: { width: '100%' as const, height: 280 },
  closeButton: { position: 'absolute' as const, top: Spacing.xxl, left: Spacing.md, width: 36, height: 36, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: Colors.white, borderRadius: 18 },
  closeText: { fontSize: 22, fontWeight: '700' as const, color: Colors.black },
  content: { padding: Spacing.lg },
  title: { fontSize: 26, fontWeight: '800' as const, color: Colors.black, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '600' as const, color: Colors.grayText, textAlign: 'center' as const, marginBottom: Spacing.lg },
  noSteps: { textAlign: 'center' as const, color: Colors.grayText, marginTop: Spacing.lg },
  step: { flexDirection: 'row' as const, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, alignItems: 'flex-start' as const, gap: Spacing.md },
  stepCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center' as const, alignItems: 'center' as const, flexShrink: 0 },
  stepNumber: { color: Colors.white, fontWeight: '700' as const, fontSize: 16 },
  stepText: { flex: 1, fontSize: 15, color: Colors.black, lineHeight: 24, paddingTop: Spacing.sm },
  list: { paddingBottom: Spacing.xxl },

  nutritionButton: { backgroundColor: Colors.primaryLight, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' as const, marginBottom: Spacing.lg },
  nutritionButtonText: { color: Colors.primary, fontWeight: '700' as const, fontSize: 14 },
  nutritionContainer: { marginBottom: Spacing.lg },
  nutritionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.black, marginBottom: Spacing.sm },
  nutritionRow: { flexDirection: 'row' as const, gap: Spacing.sm },
  nutritionCard: { flex: 1, backgroundColor: Colors.gray, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' as const },
  nutritionIcon: { fontSize: 20, marginBottom: 4 },
  nutritionValue: { fontSize: 15, fontWeight: '700' as const, color: Colors.black },
  nutritionLabel: { fontSize: 11, color: Colors.grayText, marginTop: 2 },

  ingredientsContainer: { marginBottom: Spacing.lg },
  ingredientsTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.black, marginBottom: Spacing.sm },
  ingredientsList: { gap: Spacing.sm },
  ingredientItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: Spacing.sm },
  ingredientDot: { color: Colors.primary, fontSize: 18, fontWeight: '700' as const },
  ingredientText: { fontSize: 14, color: Colors.black, textTransform: 'capitalize' as const },
})