import { useEffect, useState } from 'react'
import { View, Text, Image, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import { supabase } from '../services/supabase'
import { Colors, Spacing, Radius, Typography } from '../constants/theme'

type Step = { number: number; step: string }
type Recipe = { id: number; title: string; image: string; used: string[]; missing: string[] }

export default function RecipeDetailScreen({ recipe, onBack }: { recipe: Recipe; onBack: () => void }) {
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)

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
              <Text style={styles.sectionTitle}>Preparacion</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 280 },
  closeButton: { position: 'absolute', top: Spacing.xxl, left: Spacing.md, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 22, fontWeight: '700', color: Colors.black },
  content: { padding: Spacing.lg },
  title: { fontSize: 26, fontWeight: '800', color: Colors.black, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.grayText, textAlign: 'center', marginBottom: Spacing.lg },
  noSteps: { textAlign: 'center', color: Colors.grayText, marginTop: Spacing.lg },
  step: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, alignItems: 'flex-start', gap: Spacing.md },
  stepCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepNumber: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  stepText: { flex: 1, fontSize: 15, color: Colors.black, lineHeight: 24, paddingTop: Spacing.sm },
  list: { paddingBottom: Spacing.xxl },
})