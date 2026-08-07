import "@supabase/functions-js/edge-runtime.d.ts";

const SPOONACULAR_KEY = Deno.env.get("SPOONACULAR_KEY") ?? "";
const GOOGLE_VISION_KEY = Deno.env.get("GOOGLE_VISION_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const RESULTS_LIMIT = 2;

const VISION_SYSTEM_PROMPT = `Devuelve ÚNICAMENTE un array plano de strings en formato JSON válido, sin formato Markdown (sin \`\`\`json), sin introducciones ni explicaciones, ejemplo: ["tomate","cebolla","huevo"].
Nombres de ingredientes en español, en minúsculas y en singular.
Detecta únicamente ingredientes/alimentos relevantes para una receta de cocina. Ignora el fondo, utensilios, envases y cualquier elemento no comestible.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function detectIngredientsWithOpenAI(base64: string): Promise<string[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Detecta los ingredientes visibles en esta imagen." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 300,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "[]";
  const cleaned = content.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed) ? parsed : (parsed.ingredients ?? parsed.ingredientes ?? []);
    return list
      .map((i: any) => String(i).toLowerCase().trim())
      .filter((i: string) => i.length > 0);
  } catch (e) {
    console.error("Error parseando respuesta de OpenAI:", e, content);
    return [];
  }
}

async function translateText(texts: string[], targetLang: "es" | "en", sourceLang: "es" | "en"): Promise<string[]> {
  if (texts.length === 0) return [];

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_VISION_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        source: sourceLang,
        target: targetLang,
        format: "text",
      }),
    },
  );
  const data = await response.json();
  console.log(`translateText(${sourceLang}->${targetLang}):`, JSON.stringify(texts), "->", JSON.stringify(data.data?.translations?.map((t: any) => t.translatedText)));
  return data.data?.translations?.map((t: any) => t.translatedText) ?? texts;
}

async function autocompleteIngredient(query: string): Promise<string[]> {
  const englishQuery = (await translateText([query], "en", "es"))[0] ?? query;
  const response = await fetch(
    `https://api.spoonacular.com/food/ingredients/autocomplete?query=${encodeURIComponent(englishQuery)}&number=5&apiKey=${SPOONACULAR_KEY}`,
  );
  if (!response.ok) return [];
  const data = await response.json();
  const names = (data ?? []).map((i: any) => i.name as string);
  return translateText(names, "es", "en");
}

async function getRandomRecipes(): Promise<any[]> {
  const response = await fetch(
    `https://api.spoonacular.com/recipes/random?number=9&apiKey=${SPOONACULAR_KEY}`,
  );
  const data = await response.json();
  return (data.recipes ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    image: r.image,
    used: [],
    missing: [],
  }));
}

async function getInstructions(recipeId: number): Promise<any[]> {
  const response = await fetch(
    `https://api.spoonacular.com/recipes/${recipeId}/analyzedInstructions?apiKey=${SPOONACULAR_KEY}`,
  );
  const data = await response.json();
  if (!data || data.length === 0) return [];

  const steps = data[0].steps.map((s: any) => ({
    number: s.number,
    step: s.step,
  }));

  const stepsText = steps.map((s: any) => s.step);
  const translated = await translateText(stepsText, "es", "en");

  return steps.map((s: any, i: number) => ({
    number: s.number,
    step: translated[i] ?? s.step,
  }));
}

async function getNutrition(recipeId: number): Promise<any> {
  const response = await fetch(
    `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json?apiKey=${SPOONACULAR_KEY}`,
  );
  const data = await response.json();
  return {
    calories: Math.round(data.calories ?? 0),
    protein: data.protein ?? "0g",
    carbs: data.carbs ?? "0g",
    fat: data.fat ?? "0g",
  };
}

async function getIngredients(recipeId: number): Promise<any> {
  const response = await fetch(
    `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_KEY}`
  );
  const data = await response.json();
  
  const used = data.extendedIngredients?.map((i: any) => i.name) ?? [];
  const translatedUsed = await translateText(used, "es", "en");
  
  return {
    used: translatedUsed,
    missing: [],
  };
}

async function translateRecipes(rawRecipes: any[]) {
  const allTexts: string[] = [];
  for (const r of rawRecipes) {
    allTexts.push(r.title);
    if (r.used) allTexts.push(...r.used);
    if (r.missing) allTexts.push(...r.missing);
  }

  const translated = await translateText(allTexts, "es", "en");

  let idx = 0;
  return rawRecipes.map((r: any) => {
    const rawTitle = translated[idx++] ?? r.title;
    const title = rawTitle.replace(/\b\w/g, (c: string) => c.toUpperCase());
    const used = r.used ? r.used.map(() => translated[idx++] ?? "") : [];
    const missing = r.missing ? r.missing.map(() => translated[idx++] ?? "") : [];
    return { id: r.id, title, image: r.image, used, missing };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("--- Inicio de request --- Método:", req.method);
    const body = await req.json().catch(() => ({}));
    console.log("Body recibido:", JSON.stringify(body));

    const action = body?.action;

    if (action === "autocompleteIngredient") {
      const { query } = body;
      if (!query || typeof query !== "string") {
        return jsonResponse({ suggestions: [] });
      }
      const suggestions = await autocompleteIngredient(query);
      return jsonResponse({ suggestions });
    }

    if (action === "random") {
      const recipes = await getRandomRecipes();
      return jsonResponse({ recipes });
    }

    if (action === "instructions") {
      const { recipeId } = body;
      if (!recipeId) {
        return jsonResponse({ error: "recipeId requerido" }, 400);
      }
      const steps = await getInstructions(recipeId);
      return jsonResponse({ steps });
    }

    if (action === "nutrition") {
      const { recipeId } = body;
      if (!recipeId) {
        return jsonResponse({ error: "recipeId requerido" }, 400);
      }
      const nutrition = await getNutrition(recipeId);
      return jsonResponse({ nutrition });
    }

    if (action === "ingredients") {
      const { recipeId } = body;
      if (!recipeId) {
        return jsonResponse({ error: "recipeId requerido" }, 400);
      }
      const ingredients = await getIngredients(recipeId);
      return jsonResponse({ ingredients });
    }

    // Acción enviada por el buscador por texto
    if (action === "search") {
      const { query, diet, excludeIngredients, sort } = body;
      console.log("Procesando búsqueda:", { query, diet, excludeIngredients, sort });

      let englishQuery = query || "";
      if (englishQuery) {
        try {
          const translated = await translateText([englishQuery], "en", "es");
          englishQuery = translated[0] || englishQuery;
        } catch (e) {
          console.error("Error traduciendo consulta:", e);
        }
      }

      const params = new URLSearchParams({
        apiKey: SPOONACULAR_KEY,
        number: String(RESULTS_LIMIT),
      });

      if (englishQuery) params.append("query", englishQuery);
      if (diet) params.append("diet", diet);
      if (excludeIngredients) params.append("excludeIngredients", excludeIngredients);
      if (sort) params.append("sort", sort);

      const url = `https://api.spoonacular.com/recipes/complexSearch?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log("Respuesta de Spoonacular:", JSON.stringify(data));

      if (!data.results || !Array.isArray(data.results)) {
        return jsonResponse({
          recipes: [],
          error: data?.message || "Error al buscar recetas en Spoonacular",
        });
      }

      const rawRecipes = data.results.map((r: any) => ({
        id: r.id,
        title: r.title,
        image: r.image,
        used: [],
        missing: [],
      }));

      const recipes = await translateRecipes(rawRecipes);
      return jsonResponse({ recipes });
    }

    if (action === "findByIngredients") {
      const { ingredients } = body;
      if (!ingredients || typeof ingredients !== "string") {
        return jsonResponse({ error: "ingredients es requerido" }, 400);
      }

      const inputArr = ingredients.split(",").map((s: string) => s.trim());
      const englishIngredientsArr = await translateText(inputArr, "en", "es");
      const englishIngredientsString = englishIngredientsArr.join(",");

      const recipesUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(englishIngredientsString)}&number=${RESULTS_LIMIT}&apiKey=${SPOONACULAR_KEY}`;
      const response = await fetch(recipesUrl);
      const data = await response.json();

      if (!Array.isArray(data)) {
        return jsonResponse({ error: "Error en la API de Spoonacular", details: data }, 400);
      }

      const rawRecipes = data.map((r: any) => ({
        id: r.id,
        title: r.title,
        image: r.image,
        used: r.usedIngredients?.map((i: any) => i.name) ?? [],
        missing: r.missedIngredients?.map((i: any) => i.name) ?? [],
      }));

      const recipes = await translateRecipes(rawRecipes);
      return jsonResponse({ ingredients, recipes });
    }

    const { base64 } = body;

    if (!base64) {
      return jsonResponse({ error: "base64 o action válida requerida" }, 400);
    }

    const ingredients = await detectIngredientsWithOpenAI(base64);

    if (ingredients.length === 0) {
      return jsonResponse({ error: "No se detectaron ingredientes válidos" }, 400);
    }

    const englishIngredientsArr = await translateText(ingredients, "en", "es");
    const englishIngredientsString = englishIngredientsArr.join(",");

    const recipesUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(englishIngredientsString)}&number=${RESULTS_LIMIT}&apiKey=${SPOONACULAR_KEY}`;
    const response = await fetch(recipesUrl);
    const data = await response.json();

    const rawRecipes = (data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      used: r.usedIngredients?.map((i: any) => i.name) ?? [],
      missing: r.missedIngredients?.map((i: any) => i.name) ?? [],
    }));

    const recipes = await translateRecipes(rawRecipes);

    return jsonResponse({ ingredients: ingredients.join(","), recipes });
  } catch (err) {
    console.error("Error atrapado en catch:", err);
    return jsonResponse({ error: "Error interno: " + err }, 500);
  }
});