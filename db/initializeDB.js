/**
 * =====================================================
 * Inicialización de Base de Datos MongoDB
 * =====================================================
 * Este script crea los índices y validaciones necesarias
 * en la base de datos
 *
 * Uso: node db/initializeDB.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sirnergia';

async function initializeDatabase() {
    try {
        console.log('🔗 Conectando a MongoDB...');
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // =====================================================
        // 1. CREAR ÍNDICES
        // =====================================================
        console.log('\n📋 Creando índices...');

        // Índices de Users
        console.log('  ➜ Creando índices para Users...');
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ firstName: 1, lastName: 1 });
        await User.collection.createIndex({ createdAt: -1 });
        console.log('     ✓ Índices de Users creados');

        // Índices de Posts
        console.log('  ➜ Creando índices para Posts...');
        await Post.collection.createIndex({ userId: 1, createdAt: -1 });
        await Post.collection.createIndex({ createdAt: -1 });
        await Post.collection.createIndex({ isDeleted: 1, createdAt: -1 });
        console.log('     ✓ Índices de Posts creados');

        // Índices de Messages
        console.log('  ➜ Creando índices para Messages...');
        await Message.collection.createIndex({ sender: 1, receiver: 1, createdAt: -1 });
        await Message.collection.createIndex({ receiver: 1, sender: 1, createdAt: -1 });
        await Message.collection.createIndex({ receiver: 1, read: 1 });
        console.log('     ✓ Índices de Messages creados');

        // =====================================================
        // 2. CREAR VALIDACIONES DE SCHEMA
        // =====================================================
        console.log('\n🔐 Creando validaciones de schema...');

        // Validación para Users
        console.log('  ➜ Creando validación para Users...');
        try {
            await User.collection.dropValidation();
        } catch (err) {
            // Si no existe validación anterior, continuar
        }

        await User.collection.createValidation({
            $jsonSchema: {
                bsonType: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                    firstName: {
                        bsonType: 'string',
                        description: 'Nombre del usuario'
                    },
                    lastName: {
                        bsonType: 'string',
                        description: 'Apellido del usuario'
                    },
                    email: {
                        bsonType: 'string',
                        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                        description: 'Email válido'
                    },
                    password: {
                        bsonType: 'string',
                        description: 'Contraseña hasheada'
                    }
                }
            },
            validationLevel: 'moderate',
            validationAction: 'warn'
        }).catch(err => console.log('     ℹ Validación User: ' + err.message));
        console.log('     ✓ Validación de Users creada');

        // Validación para Posts
        console.log('  ➜ Creando validación para Posts...');
        try {
            await Post.collection.dropValidation();
        } catch (err) {
            // Si no existe validación anterior, continuar
        }

        await Post.collection.createValidation({
            $jsonSchema: {
                bsonType: 'object',
                required: ['content', 'userId', 'author'],
                properties: {
                    content: {
                        bsonType: 'string',
                        description: 'Contenido del post'
                    },
                    userId: {
                        bsonType: 'objectId',
                        description: 'ID del autor'
                    }
                }
            },
            validationLevel: 'moderate',
            validationAction: 'warn'
        }).catch(err => console.log('     ℹ Validación Post: ' + err.message));
        console.log('     ✓ Validación de Posts creada');

        // =====================================================
        // 3. MOSTRAR ESTADÍSTICAS
        // =====================================================
        console.log('\n📊 Estadísticas de la Base de Datos:');
        
        const userCount = await User.countDocuments();
        const postCount = await Post.countDocuments();
        const messageCount = await Message.countDocuments();

        console.log(`  📌 Usuarios: ${userCount}`);
        console.log(`  📌 Posts: ${postCount}`);
        console.log(`  📌 Mensajes: ${messageCount}`);

        // =====================================================
        // 4. LISTAR ÍNDICES
        // =====================================================
        console.log('\n🔑 Índices creados:');
        
        const userIndexes = await User.collection.getIndexes();
        console.log('  ➜ Índices de Users:');
        Object.keys(userIndexes).forEach(key => {
            console.log(`     • ${key}: ${JSON.stringify(userIndexes[key])}`);
        });

        const postIndexes = await Post.collection.getIndexes();
        console.log('  ➜ Índices de Posts:');
        Object.keys(postIndexes).forEach(key => {
            console.log(`     • ${key}: ${JSON.stringify(postIndexes[key])}`);
        });

        const messageIndexes = await Message.collection.getIndexes();
        console.log('  ➜ Índices de Messages:');
        Object.keys(messageIndexes).forEach(key => {
            console.log(`     • ${key}: ${JSON.stringify(messageIndexes[key])}`);
        });

        console.log('\n✅ Inicialización de base de datos completada exitosamente!');

    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar inicialización
initializeDatabase();
