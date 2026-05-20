# Guía de Eliminación de Publicaciones y Comentarios

## Cambios Realizados

Se ha implementado la funcionalidad completa para **eliminar publicaciones y comentarios** en tu red social Sirnergia. Los cambios incluyen:

### **Backend**

#### Rutas Nueva:
- **DELETE** `/api/posts/:postId` - Eliminar un post (ya existía)
  - Requiere autenticación
  - Solo el autor puede eliminar su post
  - Elimina la publicación completa

- **DELETE** `/api/posts/:postId/comentarios/:commentId` - Eliminar un comentario (NUEVA)
  - Requiere autenticación
  - Solo el autor del comentario puede eliminarlo
  - Actualiza el post y retorna los comentarios actualizados

#### Rutas Actualizadas:
- **GET** `/api/posts/usuario/:userId` 
  - Ahora incluye populate de comentarios.author para acceso a datos del autor

### **Frontend**

#### JavaScript (script.js)

Nuevas funciones:
- `handleDeletePost(postId)` - Maneja la eliminación de posts
- `handleDeleteComment(postId, commentId, commentElement)` - Maneja la eliminación de comentarios

Funciones Actualizadas:
- `createPostElement()` - Agrega botón de eliminar post (solo para autores)
- `renderComments()` - Agrega botones de eliminar comentarios (solo para autores)
- `handleComment()` - Re-renderiza comentarios con nuevos botones después de agregar
- `addPostEventListeners()` - Maneja clicks en botones de eliminar

#### Estilos (styles.css)

Nuevas clases:
- `.delete-post-btn` - Estilo del botón de eliminar post
- `.delete-comment-btn` - Estilo del botón de eliminar comentario
- `.comment-header` - Contenedor flex para nombre y botón de eliminar

Clases Actualizadas:
- `.post-header` - Ahora usa flex con gap para mejor espaciado
- `.post-avatar` - Agregado flex-shrink: 0
- `.post-info` - Agregado flex: 1 para expandirse

## Cómo Usar

### Eliminar una Publicación

1. **Ve al feed o perfil** donde aparecen tus publicaciones
2. **Busca tu post** - Aparecerá un botón **🗑️** en la esquina superior derecha del post
3. **Haz clic en el botón** de eliminar
4. **Confirma la acción** - Se te pedirá confirmación por seguridad
5. **Post eliminado** - La publicación desaparecerá del feed

### Eliminar un Comentario

1. **Abre los comentarios** - Haz clic en "💬 Comentar" en el post
2. **Busca tu comentario** - Si es tuyo, verás un botón **🗑️** al lado de tu nombre
3. **Haz clic en el botón** de eliminar
4. **Confirma la acción** - Se te pedirá confirmación
5. **Comentario eliminado** - El comentario se eliminará y la lista se actualizará

## Características de Seguridad

✅ **Solo los autores pueden eliminar**
- No puedes eliminar posts de otros usuarios
- No puedes eliminar comentarios de otros usuarios
- El servidor verifica la autenticación y autorización

✅ **Confirmación de Usuario**
- Se solicita confirmación antes de eliminar
- Evita eliminaciones accidentales

✅ **Actualización en Tiempo Real**
- Los cambios se reflejan inmediatamente sin recargar la página
- Los contadores se actualizan automáticamente

## Especificaciones Técnicas

### Modelo de Datos
El modelo Post ya tenía soporte para comentarios con estructura:
```javascript
comments: [{
    _id: ObjectId,                    // ID del comentario
    author: ObjectId ref User,        // Usuario que escribió
    content: String,                  // Texto del comentario
    createdAt: Date                   // Fecha de creación
}]
```

### Flujo de Eliminación de Post

1. Usuario hace clic en 🗑️
2. Se solicita confirmación
3. Se envía DELETE a `/api/posts/{postId}`
4. Backend verifica que `req.userId === post.userId`
5. Se elimina el post
6. Se elimina de la UI con animación
7. Se muestra notificación de éxito

### Flujo de Eliminación de Comentario

1. Usuario hace clic en 🗑️ en un comentario
2. Se solicita confirmación
3. Se envía DELETE a `/api/posts/{postId}/comentarios/{commentId}`
4. Backend verifica que `req.userId === comment.author`
5. Se elimina el comentario del array
6. Se retorna el post actualizado
7. Se re-renderiza la lista de comentarios
8. Se actualiza el contador

## Archivos Modificados

### Backend
- `routes/posts.js`
  - Agregada ruta DELETE para comentarios
  - Actualizado populate en GET /usuario/:userId

### Frontend
- `script.js`
  - Agregadas funciones handleDeletePost y handleDeleteComment
  - Actualizadas createPostElement, renderComments, handleComment
  - Actualizada addPostEventListeners

- `styles.css`
  - Agregados estilos para botones de eliminar
  - Actualizado post-header y comment-header
  - Agregado comment-header para layout flex

## Validaciones

### En el Servidor
- ✅ Usuario debe estar autenticado
- ✅ Post/comentario debe existir
- ✅ Usuario debe ser el autor
- ✅ Se devuelve error 403 si no es autor
- ✅ Se devuelve error 404 si no existe

### En el Cliente
- ✅ Se solicita confirmación del usuario
- ✅ Solo se muestran botones de eliminar para posts/comentarios propios
- ✅ Se valida antes de enviar request

## Animaciones

- **Eliminar Post**: Animación fade-out de 0.3s antes de remover del DOM
- **Botón Eliminar**: Opacidad aumenta al pasar mouse (0.6 → 1)
- **Notificaciones**: Mensajes de éxito/error se muestran temporalmente

## Próximas Mejoras (Opcional)

1. **Soft Delete** - Marcar como eliminado en lugar de borrar realmente
2. **Papelera** - Recuperar posts/comentarios eliminados
3. **Historial** - Ver qué fue eliminado y cuándo
4. **Eliminación en Cascada** - Eliminar todos los comentarios cuando se elimina un post
5. **Confirmación de Dos Pasos** - Adicional de seguridad para eliminaciones

## Troubleshooting

### El botón de eliminar no aparece
- Asegúrate de ser el autor del post/comentario
- Verifica que estés autenticado
- Recarga la página

### Error al eliminar
- Comprueba tu conexión de red
- Verifica que el servidor está corriendo
- Comprueba los logs del servidor para más detalles

### Botón no funciona
- Limpia el caché del navegador (Ctrl+Shift+Delete)
- Recarga la página (Ctrl+R)
- Verifica que JavaScript está habilitado

## Resumen de Cambios

| Componente | Cambio | Estado |
|-----------|--------|--------|
| Backend - Routes | Agregar DELETE /comentarios | ✅ Completado |
| Backend - Routes | Actualizar GET /usuario | ✅ Completado |
| Frontend - JS | Agregar handleDeletePost | ✅ Completado |
| Frontend - JS | Agregar handleDeleteComment | ✅ Completado |
| Frontend - JS | Actualizar createPostElement | ✅ Completado |
| Frontend - JS | Actualizar renderComments | ✅ Completado |
| Frontend - CSS | Agregar estilos delete buttons | ✅ Completado |
| Frontend - CSS | Actualizar post-header | ✅ Completado |

¡Tu aplicación ahora tiene control total sobre tus contenidos!
