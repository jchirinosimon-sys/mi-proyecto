/**
 * =====================================================
 * Configuración de Conexión a MongoDB
 * =====================================================
 * Maneja la conexión a la base de datos
 * Lugar: db/connection.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sirnergia';

/**
 * Conectar a MongoDB
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`✓ Conectado a MongoDB`);
        console.log(`  Base de datos: ${conn.connection.host}/${conn.connection.name}`);
        
        return conn;
    } catch (error) {
        console.error(`✗ Error al conectar a MongoDB: ${error.message}`);
        process.exit(1);
    }
};

/**
 * Desconectar de MongoDB
 */
const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('✓ Desconectado de MongoDB');
    } catch (error) {
        console.error(`✗ Error al desconectar: ${error.message}`);
    }
};

/**
 * Verificar estado de conexión
 */
const getConnectionStatus = () => {
    const status = mongoose.connection.readyState;
    const states = {
        0: 'Desconectado',
        1: 'Conectado',
        2: 'Conectando',
        3: 'Desconectando'
    };
    return states[status] || 'Desconocido';
};

module.exports = {
    connectDB,
    disconnectDB,
    getConnectionStatus
};
