# Niru — App de Recetas con IA

Niru es una aplicación móvil que permite al usuario tomar una foto de sus ingredientes, detectarlos automáticamente mediante inteligencia artificial y obtener recetas personalizadas basadas en lo que tiene disponible.

---

## Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | React Native + Expo (Expo Router) |
| Backend | Supabase Edge Functions (Deno) |
| Base de datos | Supabase (PostgreSQL) |
| Almacenamiento | Supabase Storage |
| Autenticación | Supabase Auth |
| Visión artificial | OpenAI GPT-4o (Vision) |
| Recetas | Spoonacular API |
| Traducción | Google Cloud Translate API |

---

## Funcionalidades implementadas

- Registro e inicio de sesión con verificación de correo electrónico
- Validación de contraseña segura
- Captura de imagen desde cámara o galería
- Detección de ingredientes usando OpenAI GPT-4o (Vision)
- Búsqueda de recetas basadas en ingredientes detectados
- Visualización de pasos de preparación por receta
- Guardar y eliminar recetas favoritas
- Recetas sugeridas aleatorias (cargadas una vez por usuario)
- Historial de fotos tomadas por el usuario
- Perfil de usuario editable (nombre, apellido, foto, contraseña)
- Lista de compras generada a partir de ingredientes faltantes en recetas guardadas
- Interfaz diseñada en Figma, trasladada directamente a la aplicación final

---

## Requisitos previos

- Node.js v18 o superior
- Expo CLI
- Cuenta en Supabase
- Cuenta en OpenAI con acceso a la API (modelo `gpt-4o`)
- Cuenta en Spoonacular con API key habilitada (gratis, 50 tokens por día)
- Cuenta en Google Cloud con la Cloud Translation API habilitada (usada para traducir textos de Spoonacular)

---

## Instalación

```bash
git clone https://github.com/solisarayac/NiruProyecto.git
cd app-niru
npm install
```

---

## Variables de entorno

### Cliente (Expo)

Creá un archivo `.env` en `app-niru/` con las siguientes variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
EXPO_PUBLIC_SPOONACULAR_KEY=tu_spoonacular_key
```

### Secrets de Supabase Edge Functions

Configurar desde Supabase Dashboard → Settings → Secrets (o `supabase secrets set`):

```
OPENAI_API_KEY=tu_openai_api_key
SPOONACULAR_KEY=tu_spoonacular_key
GOOGLE_VISION_KEY=tu_google_translate_key
```

> `GOOGLE_VISION_KEY` se usa exclusivamente para la Cloud Translation API (traducción de ingredientes, títulos y pasos de recetas), no para detección de imágenes.

---

## Estructura del proyecto

```
app-niru/
├── app/                      # Rutas (Expo Router)
│   ├── _layout.tsx           # Layout raíz: sesión, providers globales
│   └── (tabs)/                # Navegación por tabs
│       ├── _layout.tsx
│       ├── index.tsx          # Home: escaneo de ingredientes y recetas
│       ├── explore.tsx
│       ├── favorites.tsx
│       ├── shopping.tsx
│       └── profile.tsx
├── screens/                  # Pantallas fuera del tab bar
│   ├── LoginScreen.tsx
│   ├── VerifyScreen.tsx
│   ├── ForgotPasswordScreen.tsx
│   ├── RecipeDetailScreen.tsx
│   ├── ExploreScreen.tsx
│   ├── FavoritesScreen.tsx
│   ├── ShoppingListScreen.tsx
│   └── ProfileScreen.tsx
├── components/                # UI reutilizable
│   ├── RecipeCard.tsx
│   ├── Toast.tsx
│   ├── ConfirmModal.tsx
│   └── skeletons/              # Estados de carga por pantalla
├── context/                   # ThemeContext, ReusePhotoContext
├── hooks/                      # useFadeIn, useToast
├── services/                   # Acceso a datos y APIs externas
│   ├── supabase.ts             # Cliente de Supabase
│   ├── visionService.ts        # Invoca la Edge Function get-recipes
│   ├── photoHistory.ts         # Historial de fotos (Storage + DB)
│   ├── randomRecipes.ts        # Cache de recetas sugeridas por usuario
│   └── shoppingList.ts         # CRUD de la lista de compras
├── constants/
│   └── theme.ts                # Colores, tipografía, espaciado
└── supabase/
    └── functions/
        └── get-recipes/
            └── index.ts        # Edge Function: OpenAI Vision + Spoonacular + Translate
```

---

## Backend — Edge Function `get-recipes`

Función única en Deno que centraliza el backend. Acciones soportadas vía `body.action`:

| Acción | Descripción |
|---|---|
| _(sin action, con `base64`)_ | Detecta ingredientes en la imagen con OpenAI GPT-4o y busca recetas |
| `findByIngredients` | Busca recetas a partir de una lista de ingredientes (tags editados por el usuario) |
| `random` | Devuelve recetas sugeridas aleatorias |
| `search` | Búsqueda de recetas por texto, con filtros de dieta |
| `instructions` | Pasos de preparación de una receta, traducidos |
| `nutrition` | Información nutricional de una receta |
| `ingredients` | Ingredientes completos de una receta, traducidos |

El reconocimiento de imagen envía la foto en base64 a `gpt-4o` con un *system prompt* que exige devolver únicamente un array JSON de ingredientes en español, minúsculas y singular, sin explicaciones ni Markdown.

---

## Ejecución local

```bash
cd app-niru
npx expo start --tunnel
```

Escaneá el QR con Expo Go en tu dispositivo Android o iOS. Los cambios se ven en vivo; en la terminal aparecen los comandos útiles para la app (recargar, abrir en web, etc.).

---

## Despliegue de Edge Functions

```bash
supabase login
supabase link
supabase functions deploy get-recipes
```

Recordá configurar los secrets (`OPENAI_API_KEY`, `SPOONACULAR_KEY`, `GOOGLE_VISION_KEY`) en el proyecto de Supabase antes de invocar la función en producción.

---

## Funcionalidades pendientes

Ver [ROADMAP.md](./documentacion/goalsCalendario.md)

---

## Documentación técnica

- [Arquitectura del sistema](./documentacion/arquitectura.md)
- [Base de datos](./documentacion/baseDatos.md)
