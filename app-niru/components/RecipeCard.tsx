import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'

type Recipe = {
  id: number
  title: string
  image: string
  used: string[]
  missing: string[]
}

export default function RecipeCard({ recipe, onSave, onPress }: { recipe: Recipe, onSave: () => void, onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: recipe.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.label}>✅ Tenés: <Text style={styles.used}>{recipe.used.join(', ')}</Text></Text>
        <Text style={styles.label}>❌ Te falta: <Text style={styles.missing}>{recipe.missing.join(', ')}</Text></Text>
        <TouchableOpacity style={styles.saveButton} onPress={(e) => { e.stopPropagation(); onSave() }}>
          <Text style={styles.saveButtonText}>❤️ Guardar receta</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  image: { width: '100%', height: 180 },
  info: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#2d6a4f', marginBottom: 8 },
  label: { fontSize: 14, color: '#333', marginBottom: 4 },
  used: { color: '#2d6a4f' },
  missing: { color: '#e63946' },
  saveButton: { marginTop: 12, backgroundColor: '#2d6a4f', padding: 10, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
})