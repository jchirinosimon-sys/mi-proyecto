# Sirnergia - Red Social con MongoDB y Node.js

Una red social tipo Facebook moderna construida con **HTML5**, **CSS3**, **JavaScript** en el frontend y **Node.js/Express** con **MongoDB** en el backend.

## 🎯 Características

- ✅ **Autenticación Segura**: Login y registro con JWT
- ✅ **Base de Datos MongoDB**: Almacenamiento permanente
- ✅ **API REST Completa**: Rutas para usuarios, posts y autenticación
- ✅ **Sistema de Posts**: Crear, editar, eliminar y darle like
- ✅ **Animaciones**: Transiciones suaves y efectos visuales
- ✅ **Diseño Responsivo**: Adaptable a móviles y desktop
- ✅ **Protección de Rutas**: Endpoints seguros con autenticación

## 📁 Estructura del Proyecto

```
proyecto/
├── Frontend
│   ├── index.html          # Página de login/registro
│   ├── main.html           # Página principal
│   ├── styles.css          # Estilos CSS
│   └── script.js           # JavaScript frontend
│
├── Backend
│   ├── server.js           # Servidor principal
│   ├── package.json        # Dependencias Node.js
│   ├── .env                # Variables de entorno
│   ├── models/
│   │   ├── User.js         # Modelo de Usuario
│   │   └── Post.js         # Modelo de Post
│   ├── routes/
│   │   ├── auth.js         # Rutas de autenticación
│   │   ├── posts.js        # Rutas de posts
│   │   └── users.js        # Rutas de usuarios
│   └── middleware/
│       └── auth.js         # Middleware JWT
```

## 🚀 Instalación y Configuración

### 1️⃣ Prerequisitos

Necesitas tener instalado:
- **Node.js** (v14+): [Descargar](https://nodejs.org/)
- **MongoDB**: [Descargar Community Edition](https://www.mongodb.com/try/download/community)

### 2️⃣ Configurar MongoDB

#### Opción A: MongoDB Local
```bash
# En Windows
# 1. Instala MongoDB Community Edition
# 2. MongoDB se ejecuta como servicio automáticamente

# En Linux
sudo systemctl start mongod

# En macOS
brew services start mongodb-community
```

#### Opción B: MongoDB Atlas (Cloud - más fácil)
1. Crea una cuenta en [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Obtén la connection string
4. Actualiza `.env` con: `MONGODB_URI=tu_connection_string`

### 3️⃣ Instalar Dependencias

```bash
# Navega a la carpeta del proyecto
cd c:\proyecto

# Instala las dependencias de Node.js
npm install
```

### 4️⃣ Configurar Variables de Entorno

El archivo `.env` ya existe con la configuración inicial. Verifica:

```env
# .env
MONGODB_URI=mongodb://localhost:27017/sirnergia
PORT=5000
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_muy_segura_sirnergia_2026
CORS_ORIGIN=http://localhost:3000
```

### 5️⃣ Iniciar el Servidor

```bash
# Modo desarrollo (con auto-reload usando nodemon)
npm run dev

# Modo producción
npm start
```

Deberías ver:
```
✓ Conectado a MongoDB
🚀 Servidor ejecutándose en puerto 5000
```

### 6️⃣ Acceder a la Aplicación

Abre tu navegador en:
```
http://localhost:3000
```

O simplemente abre `index.html` directamente (pero la API estará en `localhost:5000`).

---

## 📚 Documentación de la API

### Endpoints de Autenticación

#### Registro
```http
POST /api/auth/registro
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "confirmPassword": "123456"
}
```

**Respuesta (201)**:
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGc...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "123456"
}
```

**Respuesta (200)**:
```json
{
  "message": "Sesión iniciada exitosamente",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### Obtener Perfil
```http
GET /api/auth/perfil
Authorization: Bearer eyJhbGc...
```

### Endpoints de Posts

#### Obtener Feed
```http
GET /api/posts?page=1&limit=10
```

#### Crear Post
```http
POST /api/posts
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "content": "¡Hola a todos!"
}
```

#### Dar Like a Post
```http
POST /api/posts/{postId}/like
Authorization: Bearer eyJhbGc...
```

#### Comentar en Post
```http
POST /api/posts/{postId}/comentar
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "content": "¡Excelente post!"
}
```

---

## 🔐 Autenticación con JWT

El sistema usa **JSON Web Tokens (JWT)** para la autenticación:

1. El usuario se registra o inicia sesión
2. El servidor devuelve un token
3. El frontend lo guarda en `localStorage`
4. Cada petición incluye: `Authorization: Bearer {token}`
5. El servidor valida el token en el middleware `auth.js`

---

## 💾 Modelos de Base de Datos

### Usuario (User)
```javascript
{
  firstName: String,
  lastName: String,
  email: String (único),
  password: String (hasheada con bcrypt),
  avatar: String,
  bio: String,
  friends: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Post
```javascript
{
  content: String,
  author: ObjectId (referencia a User),
  likes: [ObjectId],
  comments: [
    {
      author: ObjectId,
      content: String,
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Pruebas

### Crear una cuenta de prueba
1. Abre `http://localhost:3000` (o `index.html`)
2. Haz clic en "Regístrate aquí"
3. Completa el formulario:
   - Nombre: `Test`
   - Apellido: `User`
   - Email: `test@example.com`
   - Contraseña: `123456`
   - Confirmar: `123456`
4. Haz clic en "Registrarse"

### Crear un post
1. En la página principal, escribe algo en "¿En qué estás pensando?"
2. Haz clic en "Publicar"
3. El post aparecerá en el feed

### Dar like
1. Haz clic en "👍 Me gusta" en cualquier post
2. El contador se actualizará

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to MongoDB"
- ✅ Verifica que MongoDB está corriendo: `mongod`
- ✅ Comprueba la connection string en `.env`
- ✅ En Windows, MongoDB debe estar en los servicios

### Error 401: "Token not provided"
- ✅ Asegúrate de incluir el token en el header
- ✅ El token se guarda en `localStorage` automáticamente
- ✅ Si expira, inicia sesión nuevamente

### Error 500: "Internal Server Error"
- ✅ Revisa la consola del servidor
- ✅ Verifica la sintaxis del JSON enviado
- ✅ Comprueba que los campos requeridos están presentes

### Puerto 5000 en uso
```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :5000

# Cambiar el puerto en .env
PORT=5001
```

---

## 📦 Dependencias

### Backend
- `express`: Framework web
- `mongoose`: ODM para MongoDB
- `bcryptjs`: Hash de contraseñas
- `jsonwebtoken`: Generación de JWT
- `cors`: Control de CORS
- `dotenv`: Variables de entorno

### Desarrollo
- `nodemon`: Auto-reload en desarrollo

---

## 🚀 Deploy (Producción)

### Heroku
```bash
# Instala Heroku CLI
npm install -g heroku

# Login
heroku login

# Crear app
heroku create mi-sirnergia

# Configurar MongoDB Atlas en Heroku
heroku config:set MONGODB_URI="tu_mongodb_atlas_uri"
heroku config:set JWT_SECRET="una_clave_segura"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main
```

### Variables de Producción (.env)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sirnergia
PORT=5000
NODE_ENV=production
JWT_SECRET=una_clave_muy_segura_y_larga
CORS_ORIGIN=https://mi-sirnergia.herokuapp.com
```

---

## 📄 Licencia

Código abierto para uso personal y educativo.

---

¡Disfruta construyendo con Sirnergia! 🚀
#   m i - p r o y e c t o  
 