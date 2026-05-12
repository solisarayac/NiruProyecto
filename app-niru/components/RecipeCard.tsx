import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, Spacing, Radius, Typography } from '../constants/theme'

type Recipe = {
  id: number
  title: string
  image: string
  used: string[]
  missing: string[]
}

export default function RecipeCard({
  recipe,
  onSave,
  onPress,
  isSaved = false,
  onDelete,
}: {
  recipe: Recipe
  onSave?: () => void
  onPress: () => void
  isSaved?: boolean
  onDelete?: () => void
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: recipe.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.label}>Tienes: <Text style={styles.used}>{recipe.used.join(', ')}</Text></Text>
        <Text style={styles.label}>Te falta: <Text style={styles.missing}>{recipe.missing.join(', ')}</Text></Text>

        {isSaved ? (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteText}>Eliminar receta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={(e) => { e.stopPropagation?.(); onSave?.() }}>
            <Text style={styles.saveText}>Guardar Receta</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, marginBottom: Spacing.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.grayBorder },
  image: { width: '100%', height: 200 },
  info: { padding: Spacing.md },
  title: { fontSize: 16, fontWeight: '700', color: Colors.black, marginBottom: Spacing.sm },
  label: { fontSize: 14, color: Colors.black, marginBottom: 4 },
  used: { color: Colors.green },
  missing: { color: Colors.primary },
  saveButton: { marginTop: Spacing.sm, backgroundColor: Colors.primaryLight, padding: Spacing.sm + 2, borderRadius: Radius.full, alignItems: 'center' },
  saveText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  deleteButton: { marginTop: Spacing.sm, backgroundColor: Colors.gray, padding: Spacing.sm + 2, borderRadius: Radius.full, alignItems: 'center' },
  deleteText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
})