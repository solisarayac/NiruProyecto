# Arquitectura del Sistema — Niru

## Visión general

Niru sigue una arquitectura cliente-servidor desacoplada donde el frontend móvil se comunica con servicios externos a través de un backend serverless.

```
┌─────────────────────────────────────────────────────┐
│                  DISPOSITIVO MÓVIL                  │
│              React Native + Expo                    │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
┌──────────────┐ ┌────────┐ ┌──────────────────────┐
│  OpenAI      │ │Supabase│ │   Supabase Storage   │
│  GPT-4o      │ │  Auth  │ │ (avatars, historial) │
│  (Vision)    │ │        │ │                       │
└──────────────┘ └───┬────┘ └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Supabase Edge Fn    │
          │    get-recipes       │
          └──────────┬───────────┘
                     │
          ┌──────────┼──────────┬──────────┐
          │          │          │          │
          ▼          ▼          ▼          ▼
    ┌──────────┐ ┌────────┐ ┌────────────┐ ┌──────────────┐
    │Spoonacular│ │  DB    │ │Spoonacular │ │Google Cloud  │
    │findByIngr │ │Supabase│ │ random +   │ │Translate API │
    │/ search   │ │  PG    │ │instructions│ │(es ↔ en)     │
    └──────────┘ └────────┘ └────────────┘ └──────────────┘
```

---

## Componentes del sistema

### 1. Frontend — React Native + Expo (Expo Router)

Responsable de:
- Interfaz de usuario completa
- Captura de imagen (cámara o galería)
- Envío de imagen a la Edge Function para detección de ingredientes
- Búsqueda manual de recetas por texto (con filtros de dieta, calorías, ingredientes excluidos)
- Comunicación con Supabase Auth y DB
- Gestión de lista de compras

Organización interna:
- `app/` — rutas de Expo Router (tabs + layout raíz con auth)
- `screens/` — pantallas completas de la app
- `components/` — componentes reutilizables (incluye `skeletons/` para estados de carga)
- `context/` — `ThemeContext` (dark/light) y `ReusePhotoContext` (reusar foto del historial)
- `services/` — lógica de comunicación con APIs externas
- `hooks/` — hooks personalizados de React (`useFadeIn`, `useToast`)
- `constants/` — sistema de diseño (colores, tipografía, espaciado)

---

### 2. OpenAI GPT-4o (Vision)

Responsable de:
- Recibir la imagen en base64 junto a un *system prompt* estricto
- Detectar y devolver directamente los ingredientes visibles, ya en español, minúsculas y singular, como array JSON plano

El *system prompt* exige: solo JSON válido (sin Markdown, sin explicaciones), ingredientes en español/minúsculas/singular, ignorando fondo, utensilios y elementos no comestibles.

> Reemplazó el flujo anterior de Google Cloud Vision (label detection) + validación contra Spoonacular Autocomplete, que producía etiquetas genéricas en inglés y requería un paso extra de filtrado.

---

### 3. Supabase Edge Function — `get-recipes`

Backend serverless único, escrito en Deno/TypeScript, que centraliza toda la lógica de servidor.

Responsable de:
- Recibir imagen base64 y detectar ingredientes con OpenAI GPT-4o
- Traducir ingredientes/consultas es↔en con Google Cloud Translate (idioma de origen fijado explícitamente, sin auto-detección)
- Consultar recetas por ingredientes o por texto libre en Spoonacular
- Obtener instrucciones, información nutricional e ingredientes completos por ID de receta
- Obtener recetas aleatorias para sugerencias

Acciones disponibles (`body.action`):
| Acción | Descripción |
|---|---|
| _(sin action, con `base64`)_ | Detectar ingredientes con OpenAI y buscar recetas relacionadas |
| `findByIngredients` | Buscar recetas a partir de una lista de ingredientes (tags editables) |
| `search` | Búsqueda de recetas por texto libre, con filtros de dieta/calorías/exclusiones |
| `random` | Obtener 9 recetas aleatorias |
| `instructions` | Pasos de preparación traducidos, por ID de receta |
| `nutrition` | Información nutricional por ID de receta |
| `ingredients` | Ingredientes completos traducidos, por ID de receta |

---

### 4. Spoonacular API

Responsable de:
- Buscar recetas por ingredientes (`/recipes/findByIngredients`)
- Buscar recetas por texto con filtros (`/recipes/complexSearch`)
- Devolver instrucciones de preparación (`/recipes/{id}/analyzedInstructions`)
- Devolver información nutricional (`/recipes/{id}/nutritionWidget.json`)
- Devolver información completa de ingredientes (`/recipes/{id}/information`)
- Devolver recetas aleatorias (`/recipes/random`)

---

### 5. Google Cloud Translate API

Responsable de:
- Traducir ingredientes detectados (es → en) antes de consultar Spoonacular
- Traducir títulos, pasos de preparación e ingredientes de recetas (en → es) al devolver resultados
- Traducir la consulta de búsqueda manual (es → en)

El idioma de origen se pasa explícitamente en cada llamada (`source`) para evitar errores de auto-detección en palabras ambiguas entre idiomas (ej. "pan").

---

### 6. Supabase — Base de datos y Auth

Responsable de:
- Autenticación de usuarios (email + verificación OTP)
- Persistencia de perfiles de usuario
- Almacenamiento de recetas favoritas (indicando su origen: escaneo, sugerencia o búsqueda manual)
- Historial de fotos tomadas
- Cache de recetas aleatorias por usuario
- Lista de compras por usuario
- Almacenamiento de imágenes (Storage: `avatars`, `photo-history`)

---

## Flujo principal de la aplicación

```
1. Usuario abre la app
2. Supabase Auth verifica sesión activa
   └── No hay sesión → LoginScreen
   └── Hay sesión → HomeScreen (tabs)

3a. Escaneo por foto:
    Usuario toma/elige foto de ingredientes
    → App envía imagen base64 a Edge Function
    → Edge Function llama a OpenAI GPT-4o → ingredientes en español
    → Usuario edita/confirma tags
    → Edge Function traduce a inglés y busca recetas en Spoonacular
    → App muestra recetas con "Tienes" / "Te falta"

3b. Búsqueda manual (Explorar):
    Usuario escribe texto + aplica filtros
    → Edge Function traduce consulta y busca en Spoonacular (complexSearch)
    → App muestra resultados (sin comparación de ingredientes)

4. Usuario puede:
   └── Ver pasos de preparación → Edge Function → Spoonacular → Google Translate
   └── Guardar receta → Supabase DB (saved_recipes), marcando su origen
   └── Ver favoritos → Supabase DB, con badge según origen
   └── Agregar ingredientes faltantes a la lista de compras
```

---

## Decisiones técnicas destacadas

### Edge Function como intermediario
Se centralizan las llamadas a OpenAI, Spoonacular y Google Translate en la Edge Function para:
- Proteger las API keys del frontend
- Reducir la cantidad de llamadas desde el cliente
- Centralizar la lógica de detección y traducción de ingredientes

### Detección de ingredientes con OpenAI GPT-4o
Se reemplazó Google Cloud Vision (label detection genérica en inglés + validación contra Spoonacular Autocomplete) por una llamada directa a GPT-4o con *system prompt* que fuerza formato JSON, idioma español, minúsculas/singular y filtrado de elementos no comestibles — eliminando el paso intermedio de validación y mejorando la precisión de los nombres devueltos.

### Traducción con idioma de origen explícito
`translateText` exige siempre un `source` (`es` o `en`) en vez de auto-detección, evitando errores de traducción en palabras ambiguas entre idiomas (ej. "pan" = pan/bread en español vs. sartén en inglés).

### Origen de recetas guardadas
`saved_recipes` distingue tres orígenes (escaneo por foto, sugerencia aleatoria, búsqueda manual) mediante los flags `from_suggestions` y `from_manual_search`. La UI de Favoritos solo muestra la comparación "Tienes"/"Te falta" cuando la receta proviene del escaneo por foto, ya que es el único flujo que genera esa comparación real.

### Recetas aleatorias con cache por usuario
Para evitar gastar tokens de API en cada visita, las 9 recetas sugeridas se obtienen una sola vez por usuario y se almacenan en Supabase. Solo se vuelve a llamar a Spoonacular si el usuario no tiene recetas guardadas en `random_recipes`.

### Deduplicación en lista de compras
`addIngredients` normaliza a minúsculas y deduplica tanto contra lo ya existente en `shopping_list` como dentro del propio lote de ingredientes que se está insertando (usando un `Set` acumulativo).

### Sistema de diseño centralizado
`constants/theme.ts` define colores, tipografía, espaciado y radios de borde unificados, consumidos por todos los componentes junto con `ThemeContext` para soporte de modo claro/oscuro.
