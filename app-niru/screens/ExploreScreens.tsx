import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";

const MOCK_RECIPES = [
  { 
    id: 1, title: 'Spaghetti Carbonara', 
    image: 'https://img.spoonacular.com/recipes/654959-312x231.jpg',
    used: [], missing: [], steps: []
  },
  { 
    id: 2, title: 'Chicken Tikka Masala', 
    image: 'https://img.spoonacular.com/recipes/634269-312x231.jpg',
    used: [], missing: [], steps: []
  },
  { 
    id: 3, title: 'Avocado Toast', 
    image: 'https://img.spoonacular.com/recipes/716426-312x231.jpg',
    used: ['bread', 'avocado'], 
    missing: ['lemon', 'salt', 'pepper'],
    steps: [
      { number: 1, step: 'Tostar el pan hasta que esté dorado.' },
      { number: 2, step: 'Partir el aguacate y aplastarlo con un tenedor.' },
      { number: 3, step: 'Esparcir el aguacate sobre el pan tostado.' },
      { number: 4, step: 'Agregar sal, pimienta y unas gotas de limón al gusto.' },
    ]
  },
  { id: 4, title: 'Pancakes', image: 'https://img.spoonacular.com/recipes/643495-312x231.jpg', used: [], missing: [], steps: [] },
  { id: 5, title: 'Caesar Salad', image: 'https://img.spoonacular.com/recipes/632660-312x231.jpg', used: [], missing: [], steps: [] },
  { id: 6, title: 'Beef Tacos', image: 'https://img.spoonacular.com/recipes/639535-312x231.jpg', used: [], missing: [], steps: [] },
  { id: 7, title: 'Mushroom Risotto', image: 'https://img.spoonacular.com/recipes/649931-312x231.jpg', used: [], missing: [], steps: [] },
  { id: 8, title: 'Greek Salad', image: 'https://img.spoonacular.com/recipes/642129-312x231.jpg', used: [], missing: [], steps: [] },
  { id: 9, title: 'Banana Smoothie', image: 'https://img.spoonacular.com/recipes/632812-312x231.jpg', used: [], missing: [], steps: [] },
]



type Recipe = {
  id: number;
  title: string;
  image: string;
  used: string[];
  missing: string[];
};

export default function ExploreScreen() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  if (selectedRecipe) {
    return (
      <ScrollView
        style={styles.detailContainer}
        contentContainerStyle={styles.detailContent}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedRecipe(null)}
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Image
          source={{ uri: selectedRecipe.image }}
          style={styles.detailImage}
        />
        <View style={styles.detailInfo}>
          <Text style={styles.detailTitle}>{selectedRecipe.title}</Text>
          <Text style={styles.label}>
            ✅ Ingredientes:{" "}
            <Text style={styles.used}>{selectedRecipe.used.join(", ")}</Text>
          </Text>
          <Text style={styles.label}>
            ❌ Te falta:{" "}
            <Text style={styles.missing}>
              {selectedRecipe.missing.join(", ")}
            </Text>
          </Text>
          <View style={styles.mockSteps}>
            <Text style={styles.stepsTitle}>📋 Preparación</Text>
            <Text style={styles.mockNote}>
              ⏳ Instrucciones disponibles cuando se active la API
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍽️ Explorar Recetas</Text>
      <FlatList
        data={MOCK_RECIPES}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedRecipe(item)}
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 48 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d6a4f",
    padding: 16,
    paddingBottom: 8,
  },
  grid: { padding: 8 },
  card: {
    flex: 1,
    margin: 4,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
    elevation: 2,
    maxWidth: "31%",
  },
  cardImage: { width: "100%", height: 90 },
  cardTitle: { fontSize: 11, color: "#333", padding: 6, fontWeight: "500" },
  detailContainer: { flex: 1, backgroundColor: "#fff" },
  detailContent: { paddingBottom: 48 },
  backButton: { padding: 16, paddingTop: 48 },
  backText: { color: "#2d6a4f", fontSize: 16, fontWeight: "bold" },
  detailImage: { width: "100%", height: 220 },
  detailInfo: { padding: 16 },
  detailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d6a4f",
    marginBottom: 12,
  },
  label: { fontSize: 14, color: "#333", marginBottom: 6 },
  used: { color: "#2d6a4f" },
  missing: { color: "#e63946" },
  mockSteps: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f0f7f4",
    borderRadius: 8,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  mockNote: { color: "#888", fontSize: 14 },
});
