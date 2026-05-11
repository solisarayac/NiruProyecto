import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { supabase } from '../services/supabase'

type Step = {
  number: number;
  step: string;
};

type Recipe = {
  id: number;
  title: string;
  image: string;
  used: string[];
  missing: string[];
};

const SPOONACULAR_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY ?? "";

export default function RecipeDetailScreen({
  recipe,
  onBack,
}: {
  recipe: Recipe;
  onBack: () => void;
}) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructions();
  }, []);

async function fetchInstructions() {
    console.log('Cargando instrucciones para recipe id:', recipe.id)
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
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <FlatList
        data={steps}
        keyExtractor={(item) => item.number.toString()}
        ListHeaderComponent={() => (
          <View>
            <Image source={{ uri: recipe.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.title}>{recipe.title}</Text>
              <Text style={styles.label}>
                ✅ Tenés:{" "}
                <Text style={styles.used}>{recipe.used.join(", ")}</Text>
              </Text>
              <Text style={styles.label}>
                ❌ Te falta:{" "}
                <Text style={styles.missing}>{recipe.missing.join(", ")}</Text>
              </Text>
              <Text style={styles.stepsTitle}>📋 Preparación</Text>
            </View>
            {loading && (
              <ActivityIndicator
                size="large"
                color="#2d6a4f"
                style={{ marginTop: 16 }}
              />
            )}
            {!loading && steps.length === 0 && (
              <Text style={styles.noSteps}>
                No hay instrucciones disponibles para esta receta.
              </Text>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{item.number}</Text>
            </View>
            <Text style={styles.stepText}>{item.step}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  backButton: { padding: 16, paddingTop: 48 },
  backText: { color: "#2d6a4f", fontSize: 16, fontWeight: "bold" },
  image: { width: "100%", height: 220 },
  info: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d6a4f",
    marginBottom: 8,
  },
  label: { fontSize: 14, color: "#333", marginBottom: 4 },
  used: { color: "#2d6a4f" },
  missing: { color: "#e63946" },
  stepsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  noSteps: { textAlign: "center", color: "#888", padding: 16 },
  step: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 0,
    alignItems: "flex-start",
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2d6a4f",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepNumberText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  stepText: { flex: 1, fontSize: 15, color: "#333", lineHeight: 22 },
  list: { paddingBottom: 32 },
});
