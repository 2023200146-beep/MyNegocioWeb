const express = require('express');
const session = require('express-session');
const path = require('path');

// Importar rutas
const mainRoutes = require('./routes/mainRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const consultasRoutes = require('./routes/consultasRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de EJS - CORREGIDA PARA RENDER
const viewsPath = path.join(__dirname, 'views');
app.set('view engine', 'ejs');
app.set('views', viewsPath);

// Log para diagnóstico
console.log('📁 Views path configurado en:', viewsPath);
console.log('📁 Directorio actual:', process.cwd());
console.log('📁 Contenido de views:', require('fs').readdirSync(viewsPath));

// Resto de la configuración...
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'mi-negocio-secret-fallback',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use((req, res, next) => {
    if (!req.session.pedido) {
        req.session.pedido = [];
    }
    next();
});

// Usar rutas
app.use('/', mainRoutes);
app.use('/', carritoRoutes);
app.use('/', pedidosRoutes);
app.use('/', consultasRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});