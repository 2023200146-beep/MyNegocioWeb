const express = require('express');
const { queryDB } = require('../config/database');
const router = express.Router();


router.get('/mostrar-pedido', (req, res) => {
    try {
        const pedido = req.session.pedido || [];
        
        let totalComp = 0;
        let totalDscto = 0;
        let totalVta = 0;

        pedido.forEach(item => {
            totalComp += item.impComp;
            totalDscto += item.impDscto;
            totalVta += item.impVta;
        });

        res.json({
            success: true,
            pedido: pedido,
            totales: {
                totalComp: totalComp.toFixed(2),
                totalDscto: totalDscto.toFixed(2),
                totalVta: totalVta.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, error: error.message });
    }
});

router.post('/agregar-pedido', async (req, res) => {
    try {
        console.log('=== AGREGAR PEDIDO ===');
        console.log('Session ID:', req.sessionID);
        console.log('Pedido antes:', req.session.pedido);
        console.log('Datos recibidos:', req.body);

        const { idProducto, cantidad } = req.body;
        
        const productos = await queryDB('SELECT * FROM producto WHERE IdProducto = ?', [idProducto]);
        const producto = productos[0];

        if (!producto) {
            return res.json({ success: false, error: 'Producto no encontrado' });
        }

        if (cantidad > producto.UnidadesEnExistencia) {
            return res.json({ success: false, error: 'Stock insuficiente' });
        }

        const precio = producto.PrecioUnidad;
        const impComp = precio * cantidad;
        const descuentoFloat = producto.Descuento || 0;
        const impDscto = impComp * descuentoFloat;
        const impVta = impComp - impDscto;

        const productoExistente = req.session.pedido.find(item => item.id == idProducto);
        
        if (productoExistente) {
            productoExistente.cantidad += parseInt(cantidad);
            productoExistente.impComp = productoExistente.cantidad * precio;
            productoExistente.impDscto = productoExistente.impComp * descuentoFloat;
            productoExistente.impVta = productoExistente.impComp - productoExistente.impDscto;
        } else {
            req.session.pedido.push({
                id: producto.IdProducto,
                producto: producto.NombreProducto,
                presentacion: producto.CantidadPorUnidad,
                precio: precio,
                cantidad: parseInt(cantidad),
                impComp: impComp,
                impDscto: impDscto,
                impVta: impVta,
                descuentoFloat: descuentoFloat
            });
        }

        console.log('Pedido después:', req.session.pedido);
        console.log('=== FIN AGREGAR PEDIDO ===');

        res.json({ success: true, message: 'Producto agregado al pedido' });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, error: error.message });
    }
});


router.delete('/eliminar-pedido/:id', (req, res) => {
    try {
        const idProducto = req.params.id;
        req.session.pedido = req.session.pedido.filter(item => item.id != idProducto);
        res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, error: error.message });
    }
});


router.put('/actualizar-pedido/:id', async (req, res) => {
    try {
        const idProducto = req.params.id;
        const { cantidad } = req.body;

        const productos = await queryDB('SELECT * FROM producto WHERE IdProducto = ?', [idProducto]);
        const producto = productos[0];

        if (!producto) {
            return res.json({ success: false, error: 'Producto no encontrado' });
        }

        const itemIndex = req.session.pedido.findIndex(item => item.id == idProducto);
        if (itemIndex !== -1) {
            const precio = producto.PrecioUnidad;
            const impComp = precio * cantidad;
            const descuentoFloat = producto.Descuento || 0;
            const impDscto = impComp * descuentoFloat;
            const impVta = impComp - impDscto;

            req.session.pedido[itemIndex] = {
                ...req.session.pedido[itemIndex],
                cantidad: parseInt(cantidad),
                impComp: impComp,
                impDscto: impDscto,
                impVta: impVta,
                descuentoFloat: descuentoFloat
            };
            
            res.json({ success: true, message: 'Cantidad actualizada' });
        } else {
            res.json({ success: false, error: 'Producto no encontrado en el pedido' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;