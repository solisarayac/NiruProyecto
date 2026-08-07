import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, FlatList, Image, ScrollView,
  ActionSheetIOS, Platform, Alert as RNAlert,
  Animated
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../services/supabase";
import { detectIngredients } from "../../services/visionService";
import RecipeCard from "../../components/RecipeCard";
import RecipeDetailScreen from "../../screens/RecipeDetailScreen";
import { savePhotoToHistory } from "../../services/photoHistory";
import { getOrFetchRandomRecipes } from "../../services/randomRecipes";
import { Spacing, Radius, Typography } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import HomeSkeleton from '../../components/skeletons/HomeSkeleton';
import { addIngredients } from '../../services/shoppingList';
import { useReusePhoto } from '../../context/ReusePhotoContext';
import { useFadeIn } from '../../hooks/useFadeIn';

type Recipe = {
  id: number;
  title: string;
  image: string;
  used: string[];
  missing: string[];
};

function SuggestionCard({ item, onPress, onSave, Colors, styles }: any) {
  const { opacity, translateY } = useFadeIn()
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity style={styles.suggestionCard} onPress={() => onPress(item)}>
        <Image source={{ uri: item.image }} style={styles.suggestionImage} />
        <View style={styles.suggestionFooter}>
          <Text style={styles.suggestionTitle} numberOfLines={2}>{item.title}</Text>
          <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onSave(item) }}>
            <Text style={styles.suggestionHeart}>♡</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function HomeScreen() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analizando imagen...');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<string | null>(null);
  const [imageCaptured, setImageCaptured] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedMock, setSelectedMock] = useState<any | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Estados para los tags de ingredientes
  const [ingredientTags, setIngredientTags] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);

  // Hook de reuso de fotos
  const { reusePhoto, setReusePhoto } = useReusePhoto();

  // Hook de tema
  const { Colors } = useTheme();
  const styles = getStyles(Colors);

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => { loadSuggestions() }, []);

  useFocusEffect(
    useCallback(() => { loadSavedIds() }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (reusePhoto) {
        setImageCaptured(reusePhoto.photo_url)
        if (reusePhoto.ingredients) {
          const tags = reusePhoto.ingredients.split(',').filter(i => i.trim() !== '')
          setIngredientTags(tags)
          setIngredients(reusePhoto.ingredients)
          setShowTags(true)
        }
        setReusePhoto(null)
      }
    }, [reusePhoto])
  );

  async function loadSavedIds() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('saved_recipes').select('title').eq('user_id', user.id);
    if (data) setSavedIds(new Set(data.map((r: any) => r.title)));
  }

  async function loadSuggestions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const recipes = await getOrFetchRandomRecipes(user.id);
    setSuggestions(recipes);
    setInitialLoading(false);
  }

  function handleScanPress() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tomar foto', 'Elegir de galería'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) handleOpenCamera();
          if (index === 2) handleOpenGallery();
        }
      );
    } else {
      RNAlert.alert('Seleccionar imagen', '', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto', onPress: handleOpenCamera },
        { text: 'Elegir de galería', onPress: handleOpenGallery },
      ]);
    }
  }

  async function handleOpenCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      RNAlert.alert(
        'Permiso de cámara requerido',
        'Activá el permiso de cámara para Niru en los ajustes de tu dispositivo para poder escanear ingredientes.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.2 });
    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.base64 || !asset?.uri) {
      RNAlert.alert('No se pudo capturar la foto', 'No se recibió la imagen de la cámara. Intentá de nuevo.');
      return;
    }
    processImage(asset.base64, asset.uri);
  }

  async function handleOpenGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      RNAlert.alert(
        'Permiso de galería requerido',
        'Activá el permiso de galería para Niru en los ajustes de tu dispositivo para poder elegir una imagen.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.2 });
    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.base64 || !asset?.uri) {
      RNAlert.alert('No se pudo cargar la imagen', 'No se recibió la imagen seleccionada. Intentá de nuevo.');
      return;
    }
    processImage(asset.base64, asset.uri);
  }

  async function processImage(base64: string, uri: string) {
    setLoading(true);
    setLoadingMessage('Analizando imagen...');
    setRecipes([]);
    setIngredientTags([]);
    setShowTags(false);
    setImageCaptured(uri);
    
    const { data: { user } } = await supabase.auth.getUser();

    try {
      setLoadingMessage('Detectando ingredientes...');
      const result = await detectIngredients(base64);

      setLoadingMessage('Buscando recetas para vos...');
      const tags = result.ingredients.split(',').filter((i: string) => i.trim() !== '');
      setIngredientTags(tags);
      setIngredients(result.ingredients);
      setShowTags(true);

      if (user) await savePhotoToHistory(user.id, base64, result.ingredients);
    } catch (error: any) {
      console.log("Error:", error);
      const message = error?.message || error?.error_description || JSON.stringify(error);
      RNAlert.alert('Error al analizar la imagen', message);
      if (user) await savePhotoToHistory(user.id, base64, "");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchWithTags() {
    if (ingredientTags.length === 0) return;
    setLoading(true);
    setLoadingMessage('Buscando recetas para vos...');
    setShowTags(false);
    try {
      const result = await detectIngredients(undefined, ingredientTags.join(','));
      setRecipes(result.recipes);
    } catch (error: any) {
      console.log("Error buscando recetas:", error);
    } finally {
      setLoading(false);
    }
  }

  function removeTag(tag: string) {
    setIngredientTags(prev => prev.filter(t => t !== tag));
  }

  async function handleSaveRecipe(recipe: Recipe) {
    if (savedIds.has(recipe.title)) {
      showToast('Esta receta ya está guardada ⭐', 'info');
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("saved_recipes").insert({
      user_id: user.id, 
      recipe_id: recipe.id, 
      title: recipe.title,
      image: recipe.image, 
      used: recipe.used.join(","), 
      missing: recipe.missing.join(","),
    });

    if (!error) {
      setSavedIds(prev => new Set(prev).add(recipe.title));

      if (recipe.missing && recipe.missing.length > 0) {
        await addIngredients(user.id, recipe.missing);
      }

      showToast('Receta guardada', 'success');
    }
  }

  async function handleSaveSuggestion(recipe: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', recipe.title)
      .single()

    if (existing) { showToast('Esta receta ya está en tus favoritos ⭐', 'info'); return }

    const { error } = await supabase.from('saved_recipes').insert({
      user_id: user.id,
      recipe_id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      used: '',
      missing: '',
      from_suggestions: true,
    })

    if (!error) {
      showToast('Receta guardada ✅', 'success')
    }
  }

  if (initialLoading) return <HomeSkeleton />;
  if (selectedRecipe) return <RecipeDetailScreen recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />;
  if (selectedMock) return <RecipeDetailScreen recipe={selectedMock} onBack={() => setSelectedMock(null)} />;

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
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => { 
                  setImageCaptured(null); 
                  setRecipes([]); 
                  setIngredients(null);
                  setIngredientTags([]);
                  setShowTags(false);
                }}
              >
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

          {showTags && ingredientTags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsTitle}>Ingredientes detectados:</Text>
              <View style={styles.tagsRow}>
                {ingredientTags.map(tag => (
                  <TouchableOpacity key={tag} style={styles.tag} onPress={() => removeTag(tag)}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <Text style={styles.tagRemove}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearchWithTags}>
                <Text style={styles.searchButtonText}>Buscar recetas con estos ingredientes</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={styles.scanningCard}>
              <View style={styles.scanningIconContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
              <Text style={styles.scanningTitle}>{loadingMessage}</Text>
              <Text style={styles.scanningSubtitle}>Esto puede tomar unos segundos...</Text>
              <View style={styles.scanningDots}>
                <Text style={styles.scanningDot}>●</Text>
                <Text style={styles.scanningDot}>●</Text>
                <Text style={styles.scanningDot}>●</Text>
              </View>
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
                <SuggestionCard
                  key={item.id.toString()}
                  item={item}
                  onPress={setSelectedMock}
                  onSave={handleSaveSuggestion}
                  Colors={Colors}
                  styles={styles}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  );
}

const getStyles = (Colors: any) => ({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxl },
  hero: { padding: Spacing.lg, paddingTop: Spacing.xxl },
  heroSub: { fontSize: 14, color: Colors.primary, textAlign: 'center' as const },
  heroTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.primary, textAlign: 'center' as const, marginTop: 4 },
  scanCard: { marginHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, backgroundColor: Colors.cardBackground },
  scanLabel: { fontSize: 13, color: Colors.black, textAlign: 'center' as const, marginBottom: Spacing.sm },
  scanArea: { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.xl, alignItems: 'center' as const },
  cameraIcon: { fontSize: 48, marginBottom: Spacing.sm },
  scanText: { fontSize: 14, color: Colors.black, fontWeight: '600' as const, textAlign: 'center' as const },
  scanSubText: { fontSize: 12, color: Colors.grayText, textAlign: 'center' as const, marginTop: 4 },
  retryButton: { borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.full, padding: Spacing.sm, alignItems: 'center' as const, marginBottom: Spacing.sm },
  retryText: { color: Colors.primary, fontWeight: '600' as const, fontSize: 14 },
  capturedImage: { width: '100%' as const, height: 220, borderRadius: Radius.md, marginBottom: Spacing.sm },
  ingredientsText: { fontSize: 13, color: Colors.black, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  loadingContainer: { alignItems: 'center' as const, padding: Spacing.lg },
  loadingText: { color: Colors.grayText, marginTop: Spacing.sm, fontSize: 13 },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.primary, marginBottom: Spacing.md },
  suggestionCard: { width: 160, marginRight: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden' as const, backgroundColor: Colors.cardBackground, borderWidth: 1, borderColor: Colors.grayBorder },
  suggestionImage: { width: '100%' as const, height: 110 },
  suggestionFooter: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: Spacing.sm, paddingBottom: Spacing.sm },
  suggestionTitle: { flex: 1, fontSize: 13, fontWeight: '600' as const, color: Colors.black },
  suggestionHeart: { fontSize: 20, color: Colors.primary, paddingLeft: Spacing.sm },
  tagsContainer: { marginBottom: Spacing.md, marginTop: Spacing.sm },
  tagsTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.black, marginBottom: Spacing.sm },
  tagsRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: Spacing.sm, marginBottom: Spacing.md },
  tag: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: Spacing.sm, gap: 4 },
  tagText: { fontSize: 13, color: Colors.primary, fontWeight: '600' as const },
  tagRemove: { fontSize: 11, color: Colors.primary, fontWeight: '700' as const },
  searchButton: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' as const },
  searchButtonText: { color: Colors.white, fontWeight: '700' as const, fontSize: 14 },
  scanningCard: { margin: Spacing.md, padding: Spacing.xl, borderRadius: Radius.lg, backgroundColor: Colors.cardBackground, borderWidth: 1, borderColor: Colors.grayBorder, alignItems: 'center' as const },
  scanningIconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.primaryLight, justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: Spacing.md },
  scanningTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.black, marginBottom: Spacing.sm, textAlign: 'center' as const },
  scanningSubtitle: { fontSize: 13, color: Colors.grayText, textAlign: 'center' as const, marginBottom: Spacing.md },
  scanningDots: { flexDirection: 'row' as const, gap: Spacing.sm },
  scanningDot: { color: Colors.primary, fontSize: 10 },
});