import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import { supabase } from "../../services/supabase";
import CameraScreen from "../../screens/CameraScreen";
import { detectIngredients } from "../../services/visionService";
import RecipeCard from "../../components/RecipeCard";
import RecipeDetailScreen from "../../screens/RecipeDetailScreen";
import { savePhotoToHistory } from "../../services/photoHistory";

const MOCK_RECIPES = [
  { id: 1, title: 'Spaghetti Carbonara', image: 'https://img.spoonacular.com/recipes/654959-312x231.jpg' },
  { id: 2, title: 'Chicken Tikka Masala', image: 'https://img.spoonacular.com/recipes/634269-312x231.jpg' },
  { id: 3, title: 'Avocado Toast', image: 'https://img.spoonacular.com/recipes/716426-312x231.jpg' },
  { id: 4, title: 'Pancakes', image: 'https://img.spoonacular.com/recipes/643495-312x231.jpg' },
  { id: 5, title: 'Caesar Salad', image: 'https://img.spoonacular.com/recipes/632660-312x231.jpg' },
  { id: 6, title: 'Beef Tacos', image: 'https://img.spoonacular.com/recipes/639535-312x231.jpg' },
  { id: 7, title: 'Mushroom Risotto', image: 'https://img.spoonacular.com/recipes/649931-312x231.jpg' },
  { id: 8, title: 'Greek Salad', image: 'https://img.spoonacular.com/recipes/642129-312x231.jpg' },
  { id: 9, title: 'Banana Smoothie', image: 'https://img.spoonacular.com/recipes/632812-312x231.jpg' },
]

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
  const [showCamera, setShowCamera] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [currentBase64, setCurrentBase64] = useState<string | null>(null);
  const [selectedMock, setSelectedMock] = useState<any | null>(null)

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handleImageCaptured(base64: string) {
    setLoading(true);
    setRecipes([]);
    setShowCamera(false);
    setCurrentBase64(base64);

    const { data: { user } } = await supabase.auth.getUser();

    try {
      const result = await detectIngredients(base64);
      setIngredients(result.ingredients);
      setRecipes(result.recipes);
      if (user) await savePhotoToHistory(user.id, base64, result.ingredients);
    } catch (error: any) {
      console.log("Error:", error);
      if (user) await savePhotoToHistory(user.id, base64, "");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveRecipe(recipe: Recipe) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("saved_recipes")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", recipe.title)
      .single();

    if (existing) {
      alert("Esta receta ya está en tus favoritos ⭐");
      return;
    }

    const { error } = await supabase.from("saved_recipes").insert({
      user_id: user.id,
      recipe_id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      used: recipe.used.join(","),
      missing: recipe.missing.join(","),
    });

    if (error) {
      console.log("Error guardando:", error);
      alert("Error al guardar la receta");
    } else {
      alert("Receta guardada ✅");
    }
  }

  if (selectedRecipe) {
    return (
      <RecipeDetailScreen
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
      />
    );
  }

if (selectedMock) {
    return (
      <RecipeDetailScreen
        recipe={selectedMock}
        onBack={() => setSelectedMock(null)}
      />
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>App Recetas</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showCamera ? (
          <CameraScreen onImageCaptured={handleImageCaptured} />
        ) : (
          <View style={styles.content}>
            <TouchableOpacity style={styles.retryButton} onPress={() => setShowCamera(true)}>
              <Text style={styles.retryText}>📷 Tomar otra foto</Text>
            </TouchableOpacity>

            {currentBase64 && (
              <Image
                source={{ uri: `data:image/jpeg;base64,${currentBase64}` }}
                style={styles.capturedImage}
              />
            )}

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
              scrollEnabled={false}
              renderItem={({ item }) => (
                <RecipeCard
                  recipe={item}
                  onSave={() => handleSaveRecipe(item)}
                  onPress={() => setSelectedRecipe(item)}
                />
              )}
              contentContainerStyle={styles.list}
            />
          </View>
        )}

        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>🍽️ Recetas sugeridas</Text>
          <View style={styles.grid}>
            {MOCK_RECIPES.map(item => (
<TouchableOpacity key={item.id.toString()} style={styles.suggestionCard} onPress={() => setSelectedMock(item)}>                <Image source={{ uri: item.image }} style={styles.suggestionImage} />
                <Text style={styles.suggestionTitle} numberOfLines={2}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 20, fontWeight: "bold", color: "#2d6a4f" },
  logout: { color: "#e63946", fontSize: 16 },
  scrollContent: { flexGrow: 1 },
  content: { padding: 16 },
  retryButton: { backgroundColor: "#f0f7f4", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 12 },
  retryText: { color: "#2d6a4f", fontWeight: "bold", fontSize: 15 },
  capturedImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  ingredientsText: { fontSize: 13, color: "#555", marginBottom: 12 },
  loadingContainer: { alignItems: "center", padding: 32 },
  loadingText: { color: "#2d6a4f", marginTop: 8 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 32, fontSize: 15 },
  list: { paddingBottom: 16 },
  suggestionsSection: { padding: 16, paddingTop: 8 },
  suggestionsTitle: { fontSize: 18, fontWeight: "bold", color: "#2d6a4f", marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  suggestionCard: { width: '31%', margin: '1%', borderRadius: 10, overflow: 'hidden', backgroundColor: '#f9f9f9', elevation: 2 },
  suggestionImage: { width: '100%', height: 90 },
  suggestionTitle: { fontSize: 11, color: '#333', padding: 6, fontWeight: '500' },
});