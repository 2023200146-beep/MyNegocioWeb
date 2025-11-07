const express = require('express');
const session = require('express-session');
const path = require('path');

const mainRoutes = require('./routes/mainRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const consultasRoutes = require('./routes/consultasRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'images')));

// CONFIGURACIÓN DE SESIÓN OPTIMIZADA PARA RENDER
app.use(session({
    secret: process.env.SESSION_SECRET || 'mi-negocio-secret-fallback',
    resave: true,        // IMPORTANTE: true para Render
    saveUninitialized: true, // IMPORTANTE: true para Render
    cookie: {
        secure: false,   // false para HTTP en Render
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

// Middleware para debug MEJORADO
app.use((req, res, next) => {
    console.log('=== SESIÓN DEBUG ===');
    console.log('Session ID:', req.sessionID);
    console.log('URL:', req.url);
    console.log('Pedido length:', req.session.pedido ? req.session.pedido.length : 0);
    next();
});

app.use((req, res, next) => {
    if (!req.session.pedido) {
        req.session.pedido = [];
    }
    next();
});

app.use('/', mainRoutes);
app.use('/', carritoRoutes);
app.use('/', pedidosRoutes);
app.use('/', consultasRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});