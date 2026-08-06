# Roadmap — Niru

## Estado actual del proyecto

El flujo principal está completo y funcionando:
- Autenticación con verificación de correo y recuperación de contraseña
- Detección de ingredientes con IA (OpenAI GPT-4o Vision)
- Traducción automática de ingredientes, títulos y pasos de recetas (Google Translate)
- Búsqueda de recetas por ingredientes escaneados
- Búsqueda manual de recetas por texto, con filtros de dieta/calorías/exclusiones
- Guardar y gestionar favoritos, distinguiendo su origen (escaneo, sugerencia, búsqueda manual)
- Lista de compras con deduplicación, alimentada automáticamente desde recetas guardadas
- Perfil de usuario editable (nombre, apellido, foto, contraseña)
- Modo oscuro / claro
- UI completa basada en diseño Figma

---

## Funcionalidades completadas (antes en "pendiente")

| Funcionalidad | Estado |
|---|---|
| Recuperar contraseña | ✅ Completo (`ForgotPasswordScreen` + `resetPasswordForEmail`) |
| Traducción automática | ✅ Completo (Google Translate, con `source` explícito) |
| Búsqueda manual | ✅ Completo (`ExploreScreen`, acción `search`) |
| Cambiar IA de visión | ✅ Completo — se migró de Google Vision a **OpenAI GPT-4o** |
| Modo oscuro | ✅ Completo (`ThemeContext`) |

---

## Funcionalidades pendientes

### Prioridad Alta
| Ítem | Descripción | Estimado |
|---|---|---|
| Manejo de errores global | Captura y visualización consistente de errores en toda la app | 1 día |
| Tests automatizados | Cobertura mínima de servicios (`shoppingList`, `photoHistory`, Edge Function) | 2 días |

### Prioridad Media
| Ítem | Descripción | Estimado |
|---|---|---|
| Compartir receta | Compartir receta con otros usuarios o apps externas | 1 día |
| Caché de instrucciones/nutrición | Evitar recontar la Edge Function cada vez que se abre la misma receta | 1 día |

### Prioridad Baja
| Ítem | Descripción | Estimado |
|---|---|---|
| Notificaciones | Recordatorios o sugerencias push | 2 días |
| Compresión de imágenes | Reducir peso de fotos del historial antes de subirlas | 1 día |

---

## Deuda técnica

| Ítem | Descripción | Severidad |
|---|---|---|
| Límite de Spoonacular | Plan gratuito tiene 150 requests/día | Alta |
| Migraciones de DB no versionadas | `saved_recipes.from_manual_search` se agregó manualmente en el dashboard; no hay carpeta `supabase/migrations/` | Alta |
| Caché de instrucciones/nutrición | Los pasos y datos nutricionales se consultan cada vez, sin cache | Media |
| Compresión de imágenes | Las fotos del historial pueden ser muy pesadas | Media |
| Dedupe de favoritos por título | `saved_recipes` usa el `title` como clave de dedupe en la UI, no `recipe_id`; recetas distintas con el mismo nombre podrían chocar | Baja |
| Tests unitarios | No hay pruebas automatizadas implementadas | Baja |
