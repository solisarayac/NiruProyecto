import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Image, ActivityIndicator, ScrollView, Animated
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../services/supabase'
import { useTheme } from '../context/ThemeContext'
import { Spacing, Radius } from '../constants/theme'
import RecipeDetailScreen from './RecipeDetailScreen'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

const DIET_OPTIONS = ['Vegetariano', 'Vegano', 'Sin gluten', 'Keto', 'Paleo']
const SORT_OPTIONS = [
  { label: 'Relevancia', value: 'popularity' },
  { label: 'Tiempo', value: 'time' },
  { label: 'Calorías', value: 'calories' },
]

type Recipe = { id: number; title: string; image: string; used: string[]; missing: string[] }

const DIET_MAP: Record<string, string> = {
  'Vegetariano': 'vegetarian',
  'Vegano': 'vegan',
  'Sin gluten': 'gluten free',
  'Keto': 'ketogenic',
  'Paleo': 'paleo',
}

export default function ExploreScreen() {
  const [query, setQuery] = useState('')
  const [excludeInput, setExcludeInput] = useState('')
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([])
  const [selectedDiets, setSelectedDiets] = useState<string[]>([])
  const [selectedSort, setSelectedSort] = useState('popularity')
  const [minCalories, setMinCalories] = useState('')
  const [maxCalories, setMaxCalories] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [excludeSuggestions, setExcludeSuggestions] = useState<string[]>([])
  const excludeDebounceRef = useRef<any>(null)
  const { Colors } = useTheme()
  const styles = getStyles(Colors)
  const { toast, showToast, hideToast } = useToast()
  const debounceRef = useRef<any>(null)

  const activeFiltersCount = selectedDiets.length +
    excludedIngredients.length +
    (minCalories ? 1 : 0) +
    (maxCalories ? 1 : 0) +
    (selectedSort !== 'popularity' ? 1 : 0)

  // Cargar filtros persistidos al montar el componente
  useEffect(() => {
    loadFilters()
    loadSavedIds()
  }, [])

  async function loadSavedIds() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('saved_recipes').select('title').eq('user_id', user.id)
    if (data) setSavedIds(new Set(data.map((r: any) => r.title)))
  }

  async function handleSaveRecipe(recipe: Recipe) {
    if (savedIds.has(recipe.title)) {
      showToast('Esta receta ya está guardada ⭐', 'info')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('saved_recipes').insert({
      user_id: user.id,
      recipe_id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      used: '',
      missing: '',
      from_manual_search: true,
    })

    if (!error) {
      setSavedIds(prev => new Set(prev).add(recipe.title))
      showToast('Receta guardada ✅', 'success')
    } else {
      showToast('No se pudo guardar la receta', 'error')
    }
  }

  async function saveFilters() {
    const filters = { selectedDiets, excludedIngredients, selectedSort, minCalories, maxCalories }
    await AsyncStorage.setItem('explore_filters', JSON.stringify(filters))
  }

  async function loadFilters() {
    const saved = await AsyncStorage.getItem('explore_filters')
    if (saved) {
      const filters = JSON.parse(saved)
      setSelectedDiets(filters.selectedDiets ?? [])
      setExcludedIngredients(filters.excludedIngredients ?? [])
      setSelectedSort(filters.selectedSort ?? 'popularity')
      setMinCalories(filters.minCalories ?? '')
      setMaxCalories(filters.maxCalories ?? '')
    }
  }

  async function handleSearch(text: string) {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!text.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(() => search(text), 600)
  }

  async function search(text: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('get-recipes', {
        body: {
          action: 'search',
          query: text,
          diet: selectedDiets.map(d => DIET_MAP[d]).join(','),
          excludeIngredients: excludedIngredients.join(','),
          sort: selectedSort,
          minCalories: minCalories || undefined,
          maxCalories: maxCalories || undefined,
        }
      })
      if (error) throw error
      setResults(data.recipes ?? [])
    } catch (e) {
      showToast('Error al buscar recetas', 'error')
    } finally {
      setLoading(false)
    }
  }

  function toggleDiet(diet: string) {
    setSelectedDiets(prev =>
      prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]
    )
  }

  function addExclude(value?: string) {
    const term = (value ?? excludeInput).trim().toLowerCase()
    if (!term) return
    setExcludedIngredients(prev => [...new Set([...prev, term])])
    setExcludeInput('')
    setExcludeSuggestions([])
  }

  function handleExcludeInputChange(text: string) {
    setExcludeInput(text)
    if (excludeDebounceRef.current) clearTimeout(excludeDebounceRef.current)
    if (!text.trim()) { setExcludeSuggestions([]); return }
    excludeDebounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.functions.invoke('get-recipes', {
        body: { action: 'autocompleteIngredient', query: text.trim() }
      })
      if (!error) setExcludeSuggestions(data?.suggestions ?? [])
    }, 400)
  }

  function removeExclude(ingredient: string) {
    setExcludedIngredients(prev => prev.filter(i => i !== ingredient))
  }

  function clearFilters() {
    setSelectedDiets([])
    setExcludedIngredients([])
    setSelectedSort('popularity')
    setMinCalories('')
    setMaxCalories('')
    AsyncStorage.removeItem('explore_filters')
  }

  if (selectedRecipe) {
    return <RecipeDetailScreen recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroSub}>Descubrí nuevas recetas</Text>
        <Text style={styles.heroTitle}>Explorá y filtrá</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar recetas..."
          placeholderTextColor={Colors.grayText}
          value={query}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView style={styles.filtersPanel} contentContainerStyle={styles.filtersPanelContent}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filtros</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFilters}>Limpiar todo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Tipo de dieta</Text>
          <View style={styles.pillsRow}>
            {DIET_OPTIONS.map(diet => (
              <TouchableOpacity
                key={diet}
                style={[styles.pill, selectedDiets.includes(diet) && styles.pillActive]}
                onPress={() => toggleDiet(diet)}
              >
                <Text style={[styles.pillText, selectedDiets.includes(diet) && styles.pillTextActive]}>
                  {diet}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Rango de calorías</Text>
          <View style={styles.caloriesRow}>
            <TextInput
              style={styles.caloriesInput}
              placeholder="Mín"
              placeholderTextColor={Colors.grayText}
              value={minCalories}
              onChangeText={setMinCalories}
              keyboardType="number-pad"
            />
            <Text style={styles.calorieSep}>—</Text>
            <TextInput
              style={styles.caloriesInput}
              placeholder="Máx"
              placeholderTextColor={Colors.grayText}
              value={maxCalories}
              onChangeText={setMaxCalories}
              keyboardType="number-pad"
            />
            <Text style={styles.calorieUnit}>kcal</Text>
          </View>

          <Text style={styles.filterLabel}>Excluir ingredientes</Text>
          <View style={styles.excludeRow}>
            <TextInput
              style={styles.excludeInput}
              placeholder="Ej: maní, leche..."
              placeholderTextColor={Colors.grayText}
              value={excludeInput}
              onChangeText={handleExcludeInputChange}
              onSubmitEditing={() => addExclude()}
            />
            <TouchableOpacity style={styles.addButton} onPress={() => addExclude()}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {excludeSuggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              {excludeSuggestions.map(s => (
                <TouchableOpacity key={s} style={styles.suggestionItem} onPress={() => addExclude(s)}>
                  <Text style={styles.suggestionItemText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {excludedIngredients.length > 0 && (
            <View style={styles.tagsRow}>
              {excludedIngredients.map(i => (
                <TouchableOpacity key={i} style={styles.excludeTag} onPress={() => removeExclude(i)}>
                  <Text style={styles.excludeTagText}>{i} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.filterLabel}>Ordenar por</Text>
          <View style={styles.pillsRow}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.pill, selectedSort === opt.value && styles.pillActive]}
                onPress={() => setSelectedSort(opt.value)}
              >
                <Text style={[styles.pillText, selectedSort === opt.value && styles.pillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              setShowFilters(false)
              saveFilters()
              if (query) search(query)
            }}
          >
            <Text style={styles.applyButtonText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {loading && <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />}

      {!loading && results.length === 0 && query.length > 0 && (
        <Text style={styles.empty}>No se encontraron recetas para "{query}"</Text>
      )}

      {!loading && results.length === 0 && query.length === 0 && (
        <Text style={styles.hint}>Escribí el nombre de una receta para comenzar</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultCard} onPress={() => setSelectedRecipe(item)}>
            <Image source={{ uri: item.image }} style={styles.resultImage} />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{item.title}</Text>
              <TouchableOpacity
                style={[styles.saveResultButton, savedIds.has(item.title) && styles.saveResultButtonSaved]}
                onPress={(e) => { e.stopPropagation?.(); handleSaveRecipe(item) }}
              >
                <Text style={[styles.saveResultText, savedIds.has(item.title) && styles.saveResultTextSaved]}>
                  {savedIds.has(item.title) ? 'Guardada ✓' : 'Guardar Receta'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  )
}

const getStyles = (Colors: any) => ({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { padding: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.sm },
  heroSub: { fontSize: 14, color: Colors.primary, textAlign: 'center' as const },
  heroTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.primary, textAlign: 'center' as const, marginTop: 4 },
  searchRow: { flexDirection: 'row' as const, paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm },
  searchInput: { flex: 1, borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.full, padding: Spacing.md, fontSize: 15, color: Colors.black, backgroundColor: Colors.inputBackground, paddingHorizontal: Spacing.lg },
  filterButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.gray, justifyContent: 'center' as const, alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.grayBorder },
  filterIcon: { fontSize: 20 },
  badge: { position: 'absolute' as const, top: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, justifyContent: 'center' as const, alignItems: 'center' as const },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' as const },
  filtersPanel: { maxHeight: 400, marginHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.lg, backgroundColor: Colors.cardBackground, marginBottom: Spacing.sm },
  filtersPanelContent: { padding: Spacing.md },
  filterHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: Spacing.md },
  filterTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.black },
  clearFilters: { fontSize: 13, color: Colors.primary, fontWeight: '600' as const },
  filterLabel: { fontSize: 13, fontWeight: '700' as const, color: Colors.grayText, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  pillsRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: Spacing.sm, marginBottom: Spacing.sm },
  pill: { paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.grayBorder, backgroundColor: Colors.gray },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 13, color: Colors.grayText, fontWeight: '600' as const },
  pillTextActive: { color: Colors.white },
  caloriesRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: Spacing.sm, marginBottom: Spacing.sm },
  caloriesInput: { flex: 1, borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.md, padding: Spacing.sm, fontSize: 14, color: Colors.black, backgroundColor: Colors.inputBackground, textAlign: 'center' as const },
  calorieSep: { color: Colors.grayText, fontSize: 16 },
  calorieUnit: { color: Colors.grayText, fontSize: 13 },
  excludeRow: { flexDirection: 'row' as const, gap: Spacing.sm, marginBottom: Spacing.sm },
  excludeInput: { flex: 1, borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.md, padding: Spacing.sm, fontSize: 14, color: Colors.black, backgroundColor: Colors.inputBackground },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center' as const, alignItems: 'center' as const },
  addButtonText: { color: Colors.white, fontSize: 22, fontWeight: '700' as const },
  suggestionsBox: { borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.md, backgroundColor: Colors.inputBackground, marginBottom: Spacing.sm, overflow: 'hidden' as const },
  suggestionItem: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.grayBorder },
  suggestionItemText: { fontSize: 14, color: Colors.black, textTransform: 'capitalize' as const },
  tagsRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: Spacing.sm, marginBottom: Spacing.sm },
  excludeTag: { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: Spacing.sm },
  excludeTagText: { color: Colors.primary, fontSize: 12, fontWeight: '600' as const },
  applyButton: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' as const, marginTop: Spacing.md },
  applyButtonText: { color: Colors.white, fontWeight: '700' as const, fontSize: 15 },
  empty: { textAlign: 'center' as const, color: Colors.grayText, marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  hint: { textAlign: 'center' as const, color: Colors.grayText, marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  list: { padding: Spacing.md, paddingBottom: 40 },
  resultCard: { flexDirection: 'row' as const, backgroundColor: Colors.cardBackground, borderRadius: Radius.md, marginBottom: Spacing.sm, overflow: 'hidden' as const, borderWidth: 1, borderColor: Colors.grayBorder },
  resultImage: { width: 90, height: 90 },
  resultInfo: { flex: 1, padding: Spacing.md, justifyContent: 'center' as const },
  resultTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.black, marginBottom: Spacing.sm },
  saveResultButton: { backgroundColor: Colors.primaryLight, paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: Radius.full, alignSelf: 'flex-start' as const },
  saveResultButtonSaved: { backgroundColor: Colors.gray },
  saveResultText: { color: Colors.primary, fontWeight: '700' as const, fontSize: 13 },
  saveResultTextSaved: { color: Colors.grayText },
})