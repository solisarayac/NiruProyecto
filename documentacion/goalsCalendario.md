# Roadmap — Niru

## Estado actual del proyecto

El sistema está funcionando al 75-80% con el flujo principal completo:
- Autenticación con verificación de correo
- Detección de ingredientes con IA
- Búsqueda y visualización de recetas
- Guardar y gestionar favoritos
- Perfil de usuario editable
- UI completa basada en diseño Figma

---

## Funcionalidades pendientes

### Prioridad Alta


| Recuperar contraseña | Flujo completo de reset de contraseña por correo | 1 día |
| Traducción automática | Traducir títulos y pasos de recetas al español usando IA | 2 días |
| Manejo de errores global | Captura y visualización de errores en toda la app | 1 día |

### Prioridad Media


| Búsqueda manual | Buscar recetas por nombre o ingrediente desde la app | 2 días |
| Compartir receta | Compartir receta con otros usuarios o apps externas | 1 día |

### Prioridad Baja


| Modo oscuro | Soporte para dark mode usando el sistema de diseño | 1 día |
| Notificaciones | Recordatorios o sugerencias push | 2 días |
| Cambiar IA de visión | Reemplazar Google Vision por Gemini para mejor detección | 2 días |

---

## Cronograma de finalización

### Semana 1
- [ ] Recuperar contraseña
- [ ] Manejo de errores global
- [ ] Traducción automática con IA

### Semana 2
- [ ] Búsqueda manual de recetas
- [ ] Pruebas de integración completas

### Semana 3
- [ ] Compartir receta
- [ ] Pulido final de UI
- [ ] Pruebas en múltiples dispositivos

### Semana 4
- [ ] Modo oscuro (opcional)
- [ ] Evaluación de cambio de IA de visión
- [ ] Preparación para entrega final

---

## Deuda técnica

| Límite de Spoonacular | Plan gratuito tiene 150 requests/día | Alta |
| Caché de instrucciones | Los pasos de recetas se consultan cada vez | Media |
| Compresión de imágenes | Las fotos del historial pueden ser muy pesadas | Media |
| Tests unitarios | No hay pruebas automatizadas implementadas | Baja |