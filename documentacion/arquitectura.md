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
│ Google Cloud │ │Supabase│ │   Supabase Storage   │
│ Vision API   │ │  Auth  │ │ (avatars, historial) │
└──────────────┘ └───┬────┘ └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Supabase Edge Fn    │
          │    get-recipes       │
          └──────────┬───────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
    ┌──────────┐ ┌────────┐ ┌────────────┐
    │Spoonacular│ │  DB    │ │Spoonacular │
    │findByIngr │ │Supabase│ │ random +   │
    │           │ │  PG    │ │instructions│
    └──────────┘ └────────┘ └────────────┘
```

---

## Componentes del sistema

### 1. Frontend — React Native + Expo

Responsable de:
- Interfaz de usuario completa
- Captura de imagen (cámara o galería)
- Envío de imagen a Google Vision
- Comunicación con Supabase Auth y DB
- Llamadas a la Edge Function

Organización interna:
- `screens/` — pantallas completas de la app
- `components/` — componentes reutilizables
- `services/` — lógica de comunicación con APIs externas
- `hooks/` — hooks personalizados de React
- `constants/` — sistema de diseño (colores, tipografía, espaciado)

---

### 2. Google Cloud Vision API

Responsable de:
- Recibir la imagen en base64
- Detectar y devolver etiquetas (labels) de lo que aparece en la imagen

Limitación conocida:
- Devuelve etiquetas generales, no ingredientes específicos, otra ia si se cambia lograria este cometidto
- Se filtra la respuesta usando Spoonacular Autocomplete

---

### 3. Supabase Edge Function — `get-recipes`

Backend serverless escrito en Deno/TypeScript.

Responsable de:
- Recibir imagen base64 y detectar etiquetas con Google Vision
- Validar etiquetas contra base de datos de ingredientes de Spoonacular
- Consultar recetas por ingredientes en Spoonacular
- Obtener instrucciones de preparación por ID de receta
- Obtener recetas aleatorias para sugerencias

Acciones disponibles:
| Acción | Descripción |
|---|---|
| `base64` (default) | Detectar ingredientes y buscar recetas |
| `instructions` | Obtener pasos de preparación por ID |
| `random` | Obtener 9 recetas aleatorias |

---

### 4. Spoonacular API

Responsable de:
- Validar si una etiqueta es un ingrediente real (`/food/ingredients/autocomplete`)
- Buscar recetas por ingredientes (`/recipes/findByIngredients`)
- Devolver instrucciones de preparación (`/recipes/{id}/analyzedInstructions`)
- Devolver recetas aleatorias (`/recipes/random`)

---

### 5. Supabase — Base de datos y Auth

Responsable de:
- Autenticación de usuarios (email + verificación OTP)
- Persistencia de perfiles de usuario
- Almacenamiento de recetas favoritas
- Historial de fotos tomadas
- Cache de recetas aleatorias por usuario
- Almacenamiento de imágenes (Storage)

---

## Flujo principal de la aplicación

```
1. Usuario abre la app
2. Supabase Auth verifica sesión activa
   └── No hay sesión → LoginScreen
   └── Hay sesión → HomeScreen (tabs)

3. Usuario toma foto de ingredientes
4. App envía imagen base64 a Edge Function
5. Edge Function llama a Google Vision → obtiene etiquetas
6. Edge Function valida etiquetas con Spoonacular Autocomplete
7. Edge Function busca recetas con ingredientes válidos
8. App muestra recetas al usuario
9. Usuario puede:
   └── Ver pasos de preparación → Edge Function → Spoonacular
   └── Guardar receta → Supabase DB
   └── Ver favoritos → Supabase DB
```

---

## Decisiones técnicas destacadas

### Edge Function como intermediario
Se decidió centralizar las llamadas a Spoonacular en la Edge Function para:
- Proteger las API keys del frontend
- Reducir la cantidad de llamadas desde el cliente
- Centralizar la lógica de limpieza de ingredientes

### Filtro de ingredientes con Spoonacular
En lugar de usar una lista estática de palabras a eliminar, se valida cada etiqueta de Google Vision contra la base de datos de ingredientes de Spoonacular. Esto garantiza que solo se envíen ingredientes reales a la búsqueda de recetas.

### Recetas aleatorias con cache por usuario
Para evitar gastar tokens de API en cada visita, las 9 recetas sugeridas se obtienen una sola vez por usuario y se almacenan en Supabase. Solo se vuelve a llamar a Spoonacular si el usuario no tiene recetas guardadas.

### Sistema de diseño centralizado
Se creó `constants/theme.ts` con colores, tipografía, espaciado y radios de borde unificados. Todos los componentes consumen estas constantes para garantizar consistencia visual.