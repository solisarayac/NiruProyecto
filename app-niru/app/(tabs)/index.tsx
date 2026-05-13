import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, Image, ScrollView,
  ActionSheetIOS, Platform, Alert as RNAlert
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../services/supabase";
import { detectIngredients } from "../../services/visionService";
import RecipeCard from "../../components/RecipeCard";
import RecipeDetailScreen from "../../screens/RecipeDetailScreen";
import { savePhotoToHistory } from "../../services/photoHistory";
import { getOrFetchRandomRecipes } from "../../services/randomRecipes";
import { Colors, Spacing, Radius, Typography } from "../../constants/theme";
import Toast from '../../components/Toast'
import { useToast } from '../../hooks/useToast'

type Recipe = {
  id: number;
  title: string;
  image: string;
  used: string[];
  missing: string[];
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<string | null>(null);
  const [imageCaptured, setImageCaptured] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedMock, setSelectedMock] = useState<any | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { toast, showToast, hideToast } = useToast()

  useEffect(() => { loadSuggestions() }, [])

  useFocusEffect(
    useCallback(() => { loadSavedIds() }, [])
  )

  async function loadSavedIds() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('saved_recipes').select('title').eq('user_id', user.id)
    if (data) setSavedIds(new Set(data.map((r: any) => r.title)))
  }

  async function loadSuggestions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const recipes = await getOrFetchRandomRecipes(user.id)
    setSuggestions(recipes)
  }

  function handleScanPress() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tomar foto', 'Elegir de galería'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) handleOpenCamera()
          if (index === 2) handleOpenGallery()
        }
      )
    } else {
      RNAlert.alert('Seleccionar imagen', '', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto', onPress: handleOpenCamera },
        { text: 'Elegir de galería', onPress: handleOpenGallery },
      ])
    }
  }

  async function handleOpenCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.3 })
    if (!result.canceled && result.assets[0].base64) {
      processImage(result.assets[0].base64, result.assets[0].uri)
    }
  }

  async function handleOpenGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 })
    if (!result.canceled && result.assets[0].base64) {
      processImage(result.assets[0].base64, result.assets[0].uri)
    }
  }

  async function processImage(base64: string, uri: string) {
    setLoading(true)
    setRecipes([])
    setImageCaptured(uri)
    const { data: { user } } = await supabase.auth.getUser()
    try {
      const result = await detectIngredients(base64)
      setIngredients(result.ingredients)
      setRecipes(result.recipes)
      if (user) await savePhotoToHistory(user.id, base64, result.ingredients)
    } catch (error: any) {
      console.log("Error:", error)
      if (user) await savePhotoToHistory(user.id, base64, "")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveRecipe(recipe: Recipe) {
    if (savedIds.has(recipe.title)) {
      showToast('Esta receta ya está guardada ⭐', 'info')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from("saved_recipes").insert({
      user_id: user.id, recipe_id: recipe.id, title: recipe.title,
      image: recipe.image, used: recipe.used.join(","), missing: recipe.missing.join(","),
    })
    if (!error) {
      setSavedIds(prev => new Set(prev).add(recipe.title))
      showToast('Receta guardada', 'success')
    }
  }

  if (selectedRecipe) return <RecipeDetailScreen recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />
  if (selectedMock) return <RecipeDetailScreen recipe={selectedMock} onBack={() => setSelectedMock(null)} />

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.heroSub}>Bienvenido a Niru</Text>
          <Text style={styles.heroTitle}>Deja tu imaginacion volar.</Text>
        </View>

        <View style={styles.scanCard}>
          <Text style={styles.scanLabel}>Escanea, cocina, disfruta.</Text>

          {!imageCaptured ? (
            <TouchableOpacity style={styles.scanArea} onPress={handleScanPress}>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.scanText}>Toma la foto de tus ingredientes</Text>
              <Text style={styles.scanSubText}>o elige una imagen de tu galería</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <TouchableOpacity style={styles.retryButton} onPress={() => { setImageCaptured(null); setRecipes([]); setIngredients(null) }}>
                <Text style={styles.retryText}>Tomar foto de nuevo</Text>
              </TouchableOpacity>
              <Image source={{ uri: imageCaptured }} style={styles.capturedImage} />
              {ingredients && (
                <Text style={styles.ingredientsText}>
                  <Text style={{ fontWeight: '700' }}>Ingredientes reconocidos: </Text>{ingredients}
                </Text>
              )}
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Analizando ingredientes...</Text>
            </View>
          )}
        </View>

        {recipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recetas Disponibles</Text>
            {recipes.map((item) => (
              <RecipeCard
                key={item.id.toString()}
                recipe={item}
                onSave={() => handleSaveRecipe(item)}
                onPress={() => setSelectedRecipe(item)}
                isSaved={savedIds.has(item.title)}
              />
            ))}
          </View>
        )}

        {suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recetas Sugeridas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestions.map((item) => (
                <TouchableOpacity key={item.id.toString()} style={styles.suggestionCard} onPress={() => setSelectedMock(item)}>
                  <Image source={{ uri: item.image }} style={styles.suggestionImage} />
                  <Text style={styles.suggestionTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.suggestionFav}>Favorito de los usuarios</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { paddingBottom: Spacing.xxl },
  hero: { padding: Spacing.lg, paddingTop: Spacing.xxl },
  heroSub: { fontSize: 14, color: Colors.primary, textAlign: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: Colors.primary, textAlign: 'center', marginTop: 4 },
  scanCard: { marginHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg },
  scanLabel: { fontSize: 13, color: Colors.black, textAlign: 'center', marginBottom: Spacing.sm },
  scanArea: { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.xl, alignItems: 'center' },
  cameraIcon: { fontSize: 48, marginBottom: Spacing.sm },
  scanText: { fontSize: 14, color: Colors.black, fontWeight: '600', textAlign: 'center' },
  scanSubText: { fontSize: 12, color: Colors.grayText, textAlign: 'center', marginTop: 4 },
  retryButton: { borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.full, padding: Spacing.sm, alignItems: 'center', marginBottom: Spacing.sm },
  retryText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  capturedImage: { width: '100%', height: 220, borderRadius: Radius.md, marginBottom: Spacing.sm },
  ingredientsText: { fontSize: 13, color: Colors.black, marginTop: Spacing.sm },
  loadingContainer: { alignItems: 'center', padding: Spacing.lg },
  loadingText: { color: Colors.grayText, marginTop: Spacing.sm, fontSize: 13 },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: Spacing.md },
  suggestionCard: { width: 160, marginRight: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.grayBorder },
  suggestionImage: { width: '100%', height: 110 },
  suggestionTitle: { fontSize: 13, fontWeight: '600', color: Colors.black, padding: Spacing.sm, paddingBottom: 2 },
  suggestionFav: { fontSize: 11, color: Colors.green, paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm },
})