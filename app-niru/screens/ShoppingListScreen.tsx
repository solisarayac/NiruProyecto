import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../services/supabase'
import { getShoppingList, toggleIngredient, deleteIngredient, clearShoppingList } from '../services/shoppingList'
import { useTheme } from '../context/ThemeContext'
import { Spacing, Radius } from '../constants/theme'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import ShoppingListSkeleton from '../components/skeletons/ShoppingListSkeleton'

type ShoppingItem = {
  id: string
  ingredient: string
  checked: boolean
}

export default function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const { Colors } = useTheme()
  const styles = getStyles(Colors)
  const { toast, showToast, hideToast } = useToast()

  useFocusEffect(
    useCallback(() => { loadList() }, [])
  )

  async function loadList() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const data = await getShoppingList(user.id)
    setItems(data)
    setLoading(false)
  }

  async function handleToggle(id: string, checked: boolean) {
    await toggleIngredient(id, !checked)
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !checked } : i))
  }

  async function handleDelete(id: string) {
    await deleteIngredient(id)
    setItems(prev => prev.filter(i => i.id !== id))
    showToast('Ingrediente eliminado', 'error')
  }

  async function handleClear() {
    if (!userId) return
    await clearShoppingList(userId)
    setItems([])
    showToast('Lista limpiada', 'info')
  }

  const pending = items.filter(i => !i.checked).length
  const total = items.length

  if (loading) return <ShoppingListSkeleton />

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroSub}>Tu lista de compras</Text>
        <Text style={styles.heroTitle}>{pending} pendientes de {total}</Text>
      </View>

      {items.length === 0 ? (
        <Text style={styles.empty}>No hay ingredientes en tu lista.{'\n'}Guardá una receta para agregarlos automáticamente.</Text>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => handleToggle(item.id, item.checked)}>
                <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                  {item.checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.ingredient, item.checked && styles.ingredientChecked]}>
                  {item.ingredient}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearText}>Limpiar lista completa</Text>
          </TouchableOpacity>
        </>
      )}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  )
}

const getStyles = (Colors: any) => ({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { padding: Spacing.lg, paddingTop: 60 },
  heroSub: { fontSize: 14, color: Colors.primary, textAlign: 'center' as const },
  heroTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.primary, textAlign: 'center' as const, marginTop: 4 },
  empty: { textAlign: 'center' as const, color: Colors.grayText, marginTop: 40, fontSize: 15, paddingHorizontal: Spacing.lg, lineHeight: 24 },
  list: { padding: Spacing.md, paddingBottom: 100 },
  item: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: Colors.cardBackground, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.grayBorder, gap: Spacing.sm },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.grayBorder, justifyContent: 'center' as const, alignItems: 'center' as const },
  checkboxChecked: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkmark: { color: Colors.white, fontWeight: '700' as const, fontSize: 14 },
  ingredient: { flex: 1, fontSize: 15, color: Colors.black, textTransform: 'capitalize' as const },
  ingredientChecked: { textDecorationLine: 'line-through' as const, color: Colors.grayText },
  deleteBtn: { color: Colors.grayText, fontSize: 16, padding: 4 },
  clearButton: { position: 'absolute' as const, bottom: 20, left: Spacing.lg, right: Spacing.lg, backgroundColor: Colors.gray, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.grayBorder },
  clearText: { color: Colors.primary, fontWeight: '700' as const, fontSize: 15 },
})