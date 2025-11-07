const express = require('express');
const { queryDB } = require('../config/database');
const router = express.Router();


router.get('/inicio', (req, res) => {
    res.render('inicio');
});

router.get('/', (req, res) => {
    res.redirect('/inicio');
});

router.get('/catalogo', async (req, res) => {
    try {
        const idcat = req.query.cboCategoria || 0;
        const paisSeleccionado = req.query.cboPais || '';
        const empleadoSeleccionado = req.query.cboEmpleado || '';
        const clienteSeleccionado = req.query.lstCliente || '';
        const fechaSeleccionada = req.query.fechaPedido || '';

        const [categorias, empleados, paises] = await Promise.all([
            queryDB('SELECT * FROM categoria'),
            queryDB('SELECT IdEmpleado, Nombre, Apellidos, Cargo FROM empleado ORDER BY Nombre'),
            queryDB('SELECT DISTINCT Pais FROM cliente ORDER BY Pais')
        ]);

        let productos = [];
        let nombcat = 'Todos los Productos';

        if (idcat > 0) {
            productos = await queryDB('SELECT * FROM producto WHERE IdCategoria = ?', [idcat]);
            const categoria = categorias.find(cat => cat.IdCategoria == idcat);
            nombcat = categoria ? categoria.NombreCategoria : 'Categoría no encontrada';
        }

        let clientes = [];
        if (paisSeleccionado) {
            clientes = await queryDB('SELECT IdCliente, NombreEmpresa, Pais FROM cliente WHERE Pais = ?', [paisSeleccionado]);
        }

        res.render('catalogo', {
            categorias, productos, empleados, paises, clientes,
            idcat, nombcat, paisSeleccionado, empleadoSeleccionado, 
            clienteSeleccionado, fechaSeleccionada
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;