const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');

const mainRoutes = require('./routes/mainRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const consultasRoutes = require('./routes/consultasRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del MySQL Session Store
const sessionStoreOptions = {
    host: 'bdmynegocio-ucss-18be.g.aivencloud.com',
    port: 15841,
    user: 'avnadmin',
    password: 'AVNS_2OXAaMpicsY49ZMAY_w',
    database: 'bdmynegocio',
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true,
    schema: {
        tableName: 'user_sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

const sessionStore = new MySQLStore(sessionStoreOptions);

// Manejo de errores del session store
sessionStore.on('error', (error) => {
    console.error('Session store error:', error);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Configuración de sesión CON STORE
app.use(session({
    secret: process.env.SESSION_SECRET || 'mi-negocio-secret-fallback',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Renovar la sesión en cada request
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Middleware para debug de sesiones
app.use((req, res, next) => {
    console.log('=== SESIÓN ACTUAL ===');
    console.log('Session ID:', req.sessionID);
    console.log('Pedido en sesión:', req.session.pedido);
    console.log('=== FIN SESIÓN ===');
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