import { useCallback, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "../services/supabase";
import RecipeCard from "../components/RecipeCard";
import RecipeDetailScreen from "./RecipeDetailScreen";
import { Spacing, Radius } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import FavoritesSkeleton from "../components/skeletons/FavoritesSkeleton";

type SavedRecipe = {
  id: string;
  recipe_id: number;
  title: string;
  image: string;
  used: string;
  missing: string;
  from_suggestions: boolean;
};

export default function FavoritesScreen() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);

  const { Colors } = useTheme();
  const styles = getStyles(Colors);

  const { toast, showToast, hideToast } = useToast();

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, []),
  );

  async function fetchFavorites() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("saved_recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) setRecipes(data);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("saved_recipes")
      .delete()
      .eq("id", id);

    if (!error) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      showToast("Receta eliminada", "error");
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

  if (loading && !refreshing) {
    return <FavoritesSkeleton />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroSub}>Tus recetas favoritas</Text>
        <Text style={styles.heroTitle}>A un simple click</Text>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyTitle}>Sin recetas guardadas</Text>
            <Text style={styles.emptySubtitle}>
              Guardá tus recetas favoritas y aparecerán aquí
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View>
            {item.from_suggestions && (
              <View style={styles.suggestionBadge}>
                <Text style={styles.suggestionBadgeText}>⭐ Receta sugerida</Text>
              </View>
            )}
            <RecipeCard
              recipe={{
                id: item.recipe_id,
                title: item.title,
                image: item.image,
                used: item.used ? item.used.split(',') : [],
                missing: item.missing ? item.missing.split(',') : [],
              }}
              onPress={() => setSelectedRecipe({
                id: item.recipe_id,
                title: item.title,
                image: item.image,
                used: item.used ? item.used.split(',') : [],
                missing: item.missing ? item.missing.split(',') : [],
              })}
              isSaved={true}
              onDelete={() => handleDelete(item.id)}
            />
          </View>
        )}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />
    </View>
  );
}

const getStyles = (Colors: any) => ({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { padding: Spacing.lg, paddingTop: 60 },
  heroSub: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: "center" as const,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.primary,
    textAlign: "center" as const,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center" as const,
    paddingTop: 80,
    padding: Spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: "center" as const,
  },
  list: { padding: Spacing.md, paddingBottom: 40 },
  suggestionBadge: { 
    backgroundColor: Colors.primaryLight, 
    paddingVertical: 4, 
    paddingHorizontal: Spacing.md, 
    borderRadius: Radius.full, 
    alignSelf: 'flex-start' as const, 
    marginBottom: 4, 
    marginLeft: 4 
  },
  suggestionBadgeText: { 
    fontSize: 12, 
    color: Colors.primary, 
    fontWeight: '600' as const 
  },
});