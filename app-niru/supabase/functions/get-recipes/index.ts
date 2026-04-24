import "@supabase/functions-js/edge-runtime.d.ts"

const SPOONACULAR_KEY = Deno.env.get("SPOONACULAR_KEY") ?? ""
const GOOGLE_VISION_KEY = Deno.env.get("GOOGLE_VISION_KEY") ?? ""
const RESULTS_LIMIT = 1

async function detectLabels(base64: string): Promise<string[]> {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: 'LABEL_DETECTION', maxResults: 20 }],
        }],
      }),
    }
  )
  const data = await response.json()
  const labels = data.responses[0]?.labelAnnotations || []
  return labels.map((label: any) => label.description as string)
}

async function validateIngredient(label: string): Promise<string | null> {
  const query = encodeURIComponent(label.toLowerCase())
  const response = await fetch(
    `https://api.spoonacular.com/food/ingredients/autocomplete?query=${query}&number=1&apiKey=${SPOONACULAR_KEY}`
  )
  const data = await response.json()
  if (data && data.length > 0) {
    return data[0].name
  }
  return null
}

async function filterValidIngredients(labels: string[]): Promise<string[]> {
  const results = await Promise.all(labels.map(label => validateIngredient(label)))
  const valid = results.filter((r): r is string => r !== null)
  const unique = [...new Set(valid)]
  return unique.slice(0, 8)
}

Deno.serve(async (req) => {
  try {
    const { base64 } = await req.json()

    if (!base64) {
      return new Response(
        JSON.stringify({ error: "base64 requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const labels = await detectLabels(base64)
    console.log('Labels crudos:', labels)

    const ingredients = await filterValidIngredients(labels)
    console.log('Ingredientes validados:', ingredients)

    if (ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se detectaron ingredientes válidos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const ingredientsString = ingredients.join(',')
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientsString}&number=${RESULTS_LIMIT}&apiKey=${SPOONACULAR_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    const recipes = data.map((r: any) => ({
      title: r.title,
      image: r.image,
      used: r.usedIngredients.map((i: any) => i.name),
      missing: r.missedIngredients.map((i: any) => i.name),
    }))

    return new Response(
      JSON.stringify({ ingredients: ingredientsString, recipes }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error interno: " + err }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})