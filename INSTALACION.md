# 🛠️ INSTALACIÓN PASO A PASO - Sirnergia con MongoDB

## ✅ Checklist de Requisitos

- [ ] Node.js instalado
- [ ] MongoDB instalado o MongoDB Atlas configurado
- [ ] Editor de código (VS Code)
- [ ] Terminal/CMD

---

## 📝 Instalación Completa

### PASO 1: Instalar Node.js

1. Abre: https://nodejs.org/
2. Descarga la versión **LTS** (Long Term Support)
3. Instala siguiendo los pasos
4. Abre terminal y verifica:
   ```bash
   node --version
   npm --version
   ```

---

### PASO 2: Configurar MongoDB

#### 🔹 Opción A: MongoDB Local (Windows)

1. Abre: https://www.mongodb.com/try/download/community
2. Descarga la versión Community (latest)
3. Instala seleccionando:
   - ✅ "Install MongoDB Community Server as a service"
   - ✅ "Install MongoDB Compass" (herramienta visual)
4. MongoDB se inicia automáticamente
5. Verifica en `Data > Administration > Services` que MongoDB está iniciado

#### 🔹 Opción B: MongoDB Atlas (Recomendado - Cloud)

1. Abre: https://www.mongodb.com/cloud/atlas
2. Crea una cuenta (gratis)
3. Crea un cluster gratuito
4. En "Security" > "Database Access", crea un usuario
5. En "Network Access", agrega tu IP o `0.0.0.0/0`
6. Ve a "Clusters" y haz clic en "Connect"
7. Copia el connection string (se ve así):
   ```
   mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/sirnergia?retryWrites=true&w=majority
   ```
8. Guarda esta conexión para el paso siguiente

---

### PASO 3: Instalar Dependencias del Proyecto

```bash
# Abre la terminal en la carpeta c:\proyecto
cd c:\proyecto

# Instala todos los paquetes necesarios
npm install
```

Espera a que termine. Deberías ver `added XXX packages`.

---

### PASO 4: Configurar Variables de Entorno

1. Abre el archivo `.env` en VS Code
2. Si usas **MongoDB Local**, déjalo así:
   ```env
   MONGODB_URI=mongodb://localhost:27017/sirnergia
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=tu_clave_secreta_muy_segura_sirnergia_2026
   CORS_ORIGIN=http://localhost:3000
   ```

3. Si usas **MongoDB Atlas**, cambia MONGODB_URI por:
   ```env
   MONGODB_URI=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/sirnergia?retryWrites=true&w=majority
   ```

4. Guarda el archivo

---

### PASO 5: Arrancar el Servidor

En la terminal (en c:\proyecto):

```bash
# Modo desarrollo (auto-reinicio cuando cambias código)
npm run dev

# O modo normal
npm start
```

**Deberías ver en la terminal:**
```
✓ Conectado a MongoDB
🚀 Servidor ejecutándose en puerto 5000
```

Si ves esto, **¡funcionó!** ✅

---

### PASO 6: Abrir la Aplicación

#### Opción A: Desde el navegador
- Abre: `http://localhost:3000`
- Si no funciona, abre directamente `c:\proyecto\index.html`

#### Opción B: Con servidor local (si quieres)
En OTRA terminal:
```bash
# Con Python
python -m http.server 3000

# Con Node.js
npx http-server -p 3000
```

---

## 🧪 Prueba de Funcionamiento

### 1️⃣ Registro
- Haz clic en "Regístrate aquí"
- Rellena con datos de prueba:
  ```
  Nombre: Juan
  Apellido: Pérez
  Email: juan@test.com
  Contraseña: 123456
  Confirmar: 123456
  ```
- Verás animación de carga (spinner)
- Se te enviará a la página principal

### 2️⃣ Crear Post
- En la página principal, escribe algo
- Haz clic en "Publicar"
- Verás tu post en el feed

### 3️⃣ Dar Like
- Haz clic en "👍 Me gusta"
- El contador aumenta

### 4️⃣ Cerrar Sesión
- Click en "Cerrar Sesión" (arriba a la derecha)
- Volverás a login

---

## 🔍 Verificar Base de Datos

### Con MongoDB Compass (visual)
1. Abre MongoDB Compass
2. Conecta a `mongodb://localhost:27017` (o tu conexión de Atlas)
3. Ve a la base de datos `sirnergia`
4. Verifica que existen colecciones:
   - `users` - tus usuarios registrados
   - `posts` - las publicaciones

### Con Terminal (comando)
```bash
# Abre mongosh (terminal de MongoDB)
mongosh

# Ve a la BD
use sirnergia

# Ve tus usuarios
db.users.find()

# Ve tus posts
db.posts.find()
```

---

## ❌ Solución de Problemas

### "Cannot GET /" o error de conexión
- ✅ Verifica que el servidor está corriendo (`npm run dev`)
- ✅ Verifica que estás en `http://localhost:3000` (no 5000)

### "Cannot connect to MongoDB"
- ✅ **Local**: Verifica que MongoDB está corriendo (Services de Windows)
- ✅ **Atlas**: Verifica la connection string en `.env`
- ✅ **Atlas**: Verifica que tu IP está en "Network Access"

### "Port 5000 already in use"
```bash
# Cambia el puerto en .env
PORT=5001

# O mata el proceso (Windows)
netstat -ano | findstr :5000
taskkill /PID [número] /F
```

### Errores en registro/login
- ✅ Verifica que escribiste email válido (tiene @)
- ✅ Contraseña mínimo 6 caracteres
- ✅ Las contraseñas coinciden

### "npm command not found"
- ✅ Reinicia terminal después de instalar Node.js
- ✅ Verifica que Node.js está en PATH (mira `node --version`)

---

## 📊 Estructura Final

```
c:\proyecto\
├── Frontend
│   ├── index.html         ✅
│   ├── main.html          ✅
│   ├── styles.css         ✅
│   └── script.js          ✅
│
├── Backend
│   ├── server.js          ✅
│   ├── package.json       ✅
│   ├── .env               ✅
│   ├── models/
│   │   ├── User.js        ✅
│   │   └── Post.js        ✅
│   ├── routes/
│   │   ├── auth.js        ✅
│   │   ├── posts.js       ✅
│   │   └── users.js       ✅
│   └── middleware/
│       └── auth.js        ✅
│
└── Docs
    ├── README.md          ✅
    ├── QUICK_START.md     ✅
    └── INSTALACION.md     ✅ (este archivo)
```

---

## 🚀 ¡Listo!

Ya tienes Sirnergia corriendo con:
- ✅ Proyecto frontend completo
- ✅ Servidor Node.js/Express
- ✅ MongoDB funcionando
- ✅ Autenticación con JWT
- ✅ API REST completamente operativa

### Próximas características
- Sistema de mensajes privados
- Notificaciones en tiempo real
- Sistema de amigos avanzado
- Búsqueda de usuarios
- Upload de fotos

---

## 📞 Referencias Útiles

- Node.js: https://nodejs.org/
- MongoDB: https://www.mongodb.com/
- Express: https://expressjs.com/
- Mongoose: https://mongoosejs.com/
- JWT: https://jwt.io/

---

¿Preguntas? Revisa el `README.md` para documentación más detallada. 📖