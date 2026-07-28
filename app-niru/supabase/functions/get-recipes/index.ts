import "@supabase/functions-js/edge-runtime.d.ts";

const SPOONACULAR_KEY = Deno.env.get("SPOONACULAR_KEY") ?? "";
const GOOGLE_VISION_KEY = Deno.env.get("GOOGLE_VISION_KEY") ?? "";
const RESULTS_LIMIT = 2;

async function detectLabels(base64: string): Promise<string[]> {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "LABEL_DETECTION", maxResults: 20 }],
          },
        ],
      }),
    },
  );
  const data = await response.json();
  console.log("Vision response:", JSON.stringify(data));
  const labels = data.responses[0]?.labelAnnotations || [];
  return labels.map((label: any) => label.description as string);
}

async function translateText(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_VISION_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        target: "es",
        format: "text",
      }),
    },
  );
  const data = await response.json();
  return data.data?.translations?.map((t: any) => t.translatedText) ?? texts;
}

async function validateIngredient(label: string): Promise<string | null> {
  const query = encodeURIComponent(label.toLowerCase());
  const response = await fetch(
    `https://api.spoonacular.com/food/ingredients/autocomplete?query=${query}&number=1&apiKey=${SPOONACULAR_KEY}`,
  );
  if (!response.ok) return null;
  const data = await response.json();
  if (data && data.length > 0) {
    return data[0].name;
  }
  return null;
}

async function filterValidIngredients(labels: string[]): Promise<string[]> {
  const results = await Promise.all(
    labels.map((label) => validateIngredient(label)),
  );
  const valid = results.filter((r): r is string => r !== null);
  const unique = [...new Set(valid)];
  return unique.slice(0, 8);
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
  const translated = await translateText(stepsText);

  return steps.map((s: any, i: number) => ({
    number: s.number,
    step: translated[i] ?? s.step,
  }));
}

Deno.serve(async (req) => {
  try {
    console.log("--- Inicio de request ---");
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "random") {
      const recipes = await getRandomRecipes();
      return new Response(JSON.stringify({ recipes }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "instructions") {
      const { recipeId } = body;
      if (!recipeId) {
        return new Response(JSON.stringify({ error: "recipeId requerido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const steps = await getInstructions(recipeId);
      return new Response(JSON.stringify({ steps }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "findByIngredients") {
      const { ingredients } = body;
      if (!ingredients) {
        return new Response(
          JSON.stringify({ error: "ingredients requerido" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      const recipesUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=${RESULTS_LIMIT}&apiKey=${SPOONACULAR_KEY}`;
      const response = await fetch(recipesUrl);
      const data = await response.json();

      const rawRecipes = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        image: r.image,
        used: r.usedIngredients?.map((i: any) => i.name) ?? [],
        missing: r.missedIngredients?.map((i: any) => i.name) ?? [],
      }));

      const titles = rawRecipes.map((r: any) => r.title);
      const allUsed = rawRecipes.flatMap((r: any) => r.used);
      const allMissing = rawRecipes.flatMap((r: any) => r.missing);
      const allTexts = [...titles, ...allUsed, ...allMissing];

      const translated = await translateText(allTexts);

      let idx = 0;
      const recipes = rawRecipes.map((r: any) => {
        const rawTitle = translated[idx++] ?? "";
        const title = rawTitle.replace(/\b\w/g, (c: string) => c.toUpperCase());
        const used = r.used.map(() => translated[idx++]);
        const missing = r.missing.map(() => translated[idx++]);
        return { id: r.id, title, image: r.image, used, missing };
      });

      return new Response(JSON.stringify({ ingredients, recipes }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { base64 } = body;

    if (!base64) {
      return new Response(JSON.stringify({ error: "base64 requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const labels = await detectLabels(base64);
    console.log("Labels crudos:", labels);

    const ingredients = await filterValidIngredients(labels);
    const ingredientsTranslated = await translateText(ingredients);
    console.log("Ingredientes validados:", ingredients);

    if (ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se detectaron ingredientes válidos" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const ingredientsString = ingredients.join(",");
    const recipesUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientsString}&number=${RESULTS_LIMIT}&apiKey=${SPOONACULAR_KEY}`;
    const response = await fetch(recipesUrl);
    const data = await response.json();

    const rawRecipes = (data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      used: r.usedIngredients?.map((i: any) => i.name) ?? [],
      missing: r.missedIngredients?.map((i: any) => i.name) ?? [],
    }));

    const titles = rawRecipes.map((r: any) => r.title);
    const allUsed = rawRecipes.flatMap((r: any) => r.used);
    const allMissing = rawRecipes.flatMap((r: any) => r.missing);
    const allTexts = [...titles, ...allUsed, ...allMissing];

    const translated = await translateText(allTexts);

    let idx = 0;
    const recipes = rawRecipes.map((r: any) => {
      const rawTitle = translated[idx++] ?? "";
      const title = rawTitle.replace(/\b\w/g, (c: string) => c.toUpperCase());
      const used = r.used.map(() => translated[idx++]);
      const missing = r.missing.map(() => translated[idx++]);
      return { id: r.id, title, image: r.image, used, missing };
    });

    const ingredientsTranslatedString = ingredientsTranslated.join(",");

    return new Response(
      JSON.stringify({ ingredients: ingredientsTranslatedString, recipes }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error atrapado en catch:", err);
    return new Response(JSON.stringify({ error: "Error interno: " + err }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});