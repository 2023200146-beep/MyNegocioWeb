const express = require('express');
const session = require('express-session');
const path = require('path');

// Importar rutas
const mainRoutes = require('./routes/mainRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const consultasRoutes = require('./routes/consultasRoutes');

const app = express();
const PORT = 3000;

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({
    secret: 'mi-negocio-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Middleware para inicializar el carrito
app.use((req, res, next) => {
    if (!req.session.pedido) req.session.pedido = [];
    next();
});

// Usar rutas
app.use('/', mainRoutes);
app.use('/', pedidosRoutes);
app.use('/', consultasRoutes);  

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});