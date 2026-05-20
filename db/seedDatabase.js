/**
 * =====================================================
 * Seed Data - Datos de ejemplo para la Base de Datos
 * =====================================================
 * Este script carga datos de prueba en MongoDB
 *
 * Uso: node db/seedDatabase.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sirnergia';

async function seedDatabase() {
    try {
        console.log('🔗 Conectando a MongoDB...');
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // =====================================================
        // LIMPIAR BASE DE DATOS (OPCIONAL)
        // =====================================================
        console.log('🧹 Limpiando colecciones anteriores...');
        await User.deleteMany({});
        await Post.deleteMany({});
        await Message.deleteMany({});
        console.log('✓ Colecciones limpiadas\n');

        // =====================================================
        // 1. CREAR USUARIOS
        // =====================================================
        console.log('👥 Creando usuarios...');

        const userData = [
            {
                firstName: 'Juan',
                lastName: 'García',
                email: 'juan@example.com',
                password: 'password123',
                avatar: '👨‍💼',
                bio: 'Desarrollador Full Stack apasionado por las nuevas tecnologías'
            },
            {
                firstName: 'María',
                lastName: 'López',
                email: 'maria@example.com',
                password: 'password123',
                avatar: '👩‍💻',
                bio: 'Diseñadora gráfica y web designer'
            },
            {
                firstName: 'Carlos',
                lastName: 'Ruiz',
                email: 'carlos@example.com',
                password: 'password123',
                avatar: '👨‍🎨',
                bio: 'Fotógrafo profesional y viajero'
            },
            {
                firstName: 'Ana',
                lastName: 'Martínez',
                email: 'ana@example.com',
                password: 'password123',
                avatar: '👩‍🔬',
                bio: 'Ingeniera de software y emprendedora'
            },
            {
                firstName: 'Luis',
                lastName: 'Fernández',
                email: 'luis@example.com',
                password: 'password123',
                avatar: '👨‍🏫',
                bio: 'Educador y mentor de programación'
            }
        ];

        const users = await User.insertMany(userData);
        console.log(`✓ ${users.length} usuarios creados`);
        console.log(`  • ${users[0].firstName} ${users[0].lastName}`);
        console.log(`  • ${users[1].firstName} ${users[1].lastName}`);
        console.log(`  • ${users[2].firstName} ${users[2].lastName}`);
        console.log(`  • ${users[3].firstName} ${users[3].lastName}`);
        console.log(`  • ${users[4].firstName} ${users[4].lastName}\n`);

        // =====================================================
        // 2. ESTABLECER AMISTADES
        // =====================================================
        console.log('🤝 Estableciendo amistades...');

        // Juan es amigo de María y Carlos
        users[0].friends = [users[1]._id, users[2]._id];
        users[0].following = [users[1]._id, users[2]._id, users[3]._id];
        await users[0].save();

        // María es amiga de Juan y Ana
        users[1].friends = [users[0]._id, users[3]._id];
        users[1].following = [users[0]._id, users[3]._id, users[4]._id];
        await users[1].save();

        // Carlos es amigo de Juan
        users[2].friends = [users[0]._id];
        users[2].following = [users[0]._id, users[1]._id];
        await users[2].save();

        // Ana es amiga de María
        users[3].friends = [users[1]._id];
        users[3].following = [users[1]._id, users[4]._id];
        await users[3].save();

        // Luis sigue a todos
        users[4].friends = [];
        users[4].following = [users[0]._id, users[1]._id, users[2]._id, users[3]._id];
        await users[4].save();

        console.log('✓ Amistades establecidas\n');

        // =====================================================
        // 3. CREAR POSTS
        // =====================================================
        console.log('📝 Creando posts...');

        const postData = [
            {
                content: '¡Hola a todos! Acababa de lanzar mi nuevo proyecto web. ¡Espero que les guste!',
                author: users[0].firstName + ' ' + users[0].lastName,
                userId: users[0]._id,
                photos: []
            },
            {
                content: 'Trabajando en el diseño de un nuevo sitio web. El diseño responsive es clave en 2026 🚀',
                author: users[1].firstName + ' ' + users[1].lastName,
                userId: users[1]._id,
                photos: []
            },
            {
                content: 'Hermoso atardecer en la montaña. La naturaleza nunca deja de sorprenderme 📸',
                author: users[2].firstName + ' ' + users[2].lastName,
                userId: users[2]._id,
                photos: []
            },
            {
                content: 'Feliz de compartir que comenzaré a trabajar en una startup de tecnología. ¡Nuevas aventuras!',
                author: users[3].firstName + ' ' + users[3].lastName,
                userId: users[3]._id,
                photos: []
            },
            {
                content: 'Tips de programación: Siempre escribe código que el humano pueda entender. El código debe ser legible ante todo.',
                author: users[4].firstName + ' ' + users[4].lastName,
                userId: users[4]._id,
                photos: []
            }
        ];

        const posts = await Post.insertMany(postData);
        console.log(`✓ ${posts.length} posts creados\n`);

        // =====================================================
        // 4. AGREGAR LIKES A POSTS
        // =====================================================
        console.log('❤️  Agregando likes...');

        // Post 1: Juan recibe likes de María y Carlos
        posts[0].likes = [users[1]._id, users[2]._id];
        await posts[0].save();

        // Post 2: María recibe likes de Juan y Ana
        posts[1].likes = [users[0]._id, users[3]._id];
        await posts[1].save();

        // Post 3: Carlos recibe likes de Juan, María y Luis
        posts[2].likes = [users[0]._id, users[1]._id, users[4]._id];
        await posts[2].save();

        console.log('✓ Likes agregados\n');

        // =====================================================
        // 5. AGREGAR COMENTARIOS A POSTS
        // =====================================================
        console.log('💬 Agregando comentarios...');

        // Comentarios en Post 1 (de Juan)
        await posts[0].addComment(users[1]._id, users[1].firstName, '¡Se ve increíble Juan! Felicidades 🎉');
        await posts[0].addComment(users[2]._id, users[2].firstName, 'Muy buen trabajo, me encanta!');

        // Comentarios en Post 2 (de María)
        await posts[1].addComment(users[0]._id, users[0].firstName, 'El diseño está hermoso María');
        await posts[1].addComment(users[3]._id, users[3].firstName, 'Me encanta tu estilo de diseño');

        // Comentarios en Post 5 (de Luis)
        await posts[4].addComment(users[0]._id, users[0].firstName, 'Excelente consejo, lo recordaré');

        console.log('✓ Comentarios agregados\n');

        // =====================================================
        // 6. CREAR MENSAJES
        // =====================================================
        console.log('💌 Creando mensajes de prueba...');

        const messageData = [
            {
                sender: users[0]._id,
                receiver: users[1]._id,
                content: '¡Hola María! ¿Cómo estás?',
                read: true
            },
            {
                sender: users[1]._id,
                receiver: users[0]._id,
                content: '¡Hola Juan! Muy bien, ¿y tú?',
                read: false
            },
            {
                sender: users[0]._id,
                receiver: users[1]._id,
                content: 'Excelente. ¿Quieres revisar mi nuevo proyecto?',
                read: false
            },
            {
                sender: users[0]._id,
                receiver: users[2]._id,
                content: '¡Carlos! Tus fotos están increíbles',
                read: true
            },
            {
                sender: users[2]._id,
                receiver: users[0]._id,
                content: '¡Gracias Juan! Seguiré viajando y tomando fotos',
                read: true
            },
            {
                sender: users[1]._id,
                receiver: users[3]._id,
                content: 'Ana, ¿tienes tiempo para una videollamada?',
                read: false
            }
        ];

        const messages = await Message.insertMany(messageData);
        console.log(`✓ ${messages.length} mensajes creados\n`);

        // =====================================================
        // 7. MOSTRAR ESTADÍSTICAS
        // =====================================================
        console.log('📊 Estadísticas de la Base de Datos:');
        console.log(`  📌 Usuarios: ${await User.countDocuments()}`);
        console.log(`  📌 Posts: ${await Post.countDocuments()}`);
        console.log(`  📌 Mensajes: ${await Message.countDocuments()}\n`);

        // =====================================================
        // 8. EJEMPLOS DE CONSULTAS
        // =====================================================
        console.log('🔍 Ejemplos de consultas:');
        console.log('\n1️⃣  Obtener todos los usuarios:');
        const allUsers = await User.find().select('firstName lastName email');
        console.log(`   ${allUsers.length} usuarios encontrados`);
        allUsers.forEach(u => {
            console.log(`     • ${u.firstName} ${u.lastName} (${u.email})`);
        });

        console.log('\n2️⃣  Obtener posts de Juan:');
        const juanPosts = await Post.find({ userId: users[0]._id });
        console.log(`   ${juanPosts.length} posts encontrados`);

        console.log('\n3️⃣  Obtener conversación entre Juan y María:');
        const conversation = await Message.getConversation(users[0]._id, users[1]._id);
        console.log(`   ${conversation.length} mensajes en la conversación`);

        console.log('\n4️⃣  Mensajes no leídos de María:');
        const unreadMessages = await Message.find({ 
            receiver: users[1]._id, 
            read: false 
        }).select('content sender');
        console.log(`   ${unreadMessages.length} mensajes sin leer`);

        console.log('\n✅ Seed data cargada exitosamente!');

    } catch (error) {
        console.error('❌ Error al cargar seed data:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de MongoDB');
    }
}

// Ejecutar seed
seedDatabase();
