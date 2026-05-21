/**
 * Marca una cuenta como administradora.
 * Uso: node db/setAdmin.js tu@email.com
 */
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const email = process.argv[2];

if (!email) {
    console.error('Uso: node db/setAdmin.js tu@email.com');
    process.exit(1);
}

async function setAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sirnergia');

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { isAdmin: true },
            { new: true }
        );

        if (!user) {
            console.error(`No se encontró ningún usuario con el email ${email}`);
            process.exit(1);
        }

        console.log(`✓ ${user.firstName} ${user.lastName} (${user.email}) ahora es administrador.`);
        console.log('Cierra sesión y vuelve a entrar para que se apliquen los permisos en la app.');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

setAdmin();
