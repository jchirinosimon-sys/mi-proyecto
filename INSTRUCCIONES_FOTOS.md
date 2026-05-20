# Guía de Instalación - Funcionalidad de Fotos

## Cambios Realizados

Se ha implementado la funcionalidad completa para publicar fotos en tu red social Sirnergia. Los cambios incluyen:

### 1. **Backend**
- ✅ Actualizado `models/Post.js` para incluir un campo `photos` (array de rutas de imágenes)
- ✅ Instalado multer en `package.json` para manejo de carga de archivos
- ✅ Actualizado `routes/posts.js` para:
  - Configurar multer con almacenamiento en la carpeta `uploads/`
  - Aceptar hasta 5 fotos por post
  - Limitar tamaño a 10MB por archivo
  - Solo permitir formatos: JPEG, PNG, GIF, WebP
- ✅ Actualizado `server.js` para servir la carpeta `/uploads`
- ✅ Creada carpeta `uploads/` para almacenar las imágenes

### 2. **Frontend**
- ✅ Actualizado `main.html` para:
  - Agregar input file oculto
  - Crear área de preview de fotos
- ✅ Actualizado `script.js` para:
  - Manejar selección de archivos
  - Mostrar preview de fotos seleccionadas
  - Permitir eliminar fotos individuales antes de publicar
  - Enviar FormData con las fotos al servidor
- ✅ Actualizado `styles.css` con estilos para:
  - Preview de fotos
  - Botón de eliminar fotos
  - Galería de fotos en posts

## Pasos Finales Necesarios

### Paso 1: Instalar Dependencias
Abre una terminal en `c:\proyecto` y ejecuta:

```bash
npm install
```

Esto instalará `multer` y las otras dependencias necesarias.

### Paso 2: Reiniciar el Servidor
Si tu servidor está corriendo, deténlo (Ctrl+C) e inicia nuevamente:

```bash
npm start
```

O en modo desarrollo:

```bash
npm run dev
```

## Cómo Usar la Funcionalidad de Fotos

1. **En la página principal**, debajo del campo "¿En qué estás pensando?" verás un botón "📸 Foto"
2. **Haz clic en el botón** para seleccionar una o más imágenes
3. **Verás un preview** de las fotos seleccionadas en una galería
4. **Puedes eliminar fotos** haciendo clic en la ✕ de cada preview
5. **Escribe un caption** (opcional) si lo deseas
6. **Haz clic en "Publicar"** para compartir tu post con fotos

## Especificaciones Técnicas

- **Máximo de fotos**: 5 por post
- **Tamaño máximo**: 10MB por foto
- **Formatos permitidos**: JPEG, PNG, GIF, WebP
- **Carpeta de almacenamiento**: `/uploads/` en la raíz del proyecto
- **Acceso a fotos**: `http://localhost:5000/uploads/[nombre-archivo]`

## Estructura del Modelo Post

```javascript
{
    content: String,              // Texto del post
    author: String,              // Nombre del autor
    userId: ObjectId,            // ID del usuario
    photos: [String],            // Array de rutas de fotos
    likes: [ObjectId],           // Array de usuarios que le dieron like
    comments: [{...}],           // Array de comentarios
    createdAt: Date,             // Fecha de creación
    updatedAt: Date              // Fecha de actualización
}
```

## Resolución de Problemas

### Las fotos no se cargan
1. Asegúrate de que la carpeta `uploads/` existe
2. Verifica que el servidor esté sirviendo correctamente `/uploads`
3. Comprueba que los archivos se están guardando en la carpeta `uploads/`

### Error "archivo demasiado grande"
- Las fotos no deben exceder 10MB
- El servidor rechazará archivos más grandes

### Formato no permitido
- Solo se permiten: JPEG, PNG, GIF, WebP
- Convierte tus imágenes a uno de estos formatos

## Próximos Pasos (Opcional)

Si quieres mejorar la funcionalidad:

1. **Agregar compresión de imágenes** - Usar librerías como `sharp` para optimizar tamaños
2. **Agregar galería lightbox** - Permitir ver fotos a pantalla completa
3. **Almacenamiento en la nube** - Cambiar de almacenamiento local a AWS S3, Cloudinary, etc.
4. **Edición de imágenes** - Agregar filtros antes de publicar
5. **Cuota de almacenamiento** - Limitar el almacenamiento por usuario

## Archivos Modificados

- `package.json` - Agregada dependencia de multer
- `models/Post.js` - Agregado campo photos
- `routes/posts.js` - Configurado multer y manejo de fotos
- `server.js` - Agregada ruta para servir uploads
- `main.html` - Agregado input file y preview
- `script.js` - Agregada lógica de carga y preview
- `styles.css` - Agregados estilos para fotos

## Necesitas Ayuda?

Si algo no funciona después de estos pasos, verifica:
1. ✅ Que npm install se ejecutó correctamente
2. ✅ Que el servidor está corriendo sin errores
3. ✅ Que tienes permisos de escritura en la carpeta `uploads/`
4. ✅ Que usas formatos de imagen válidos
