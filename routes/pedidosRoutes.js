const express = require('express');
const { queryDB } = require('../config/database');
const router = express.Router();


router.get('/detalle-pedido', async (req, res) => {
    try {
        const { empleado, fecha, cliente, pais } = req.query;
        
        if (!empleado || !cliente) {
            return res.status(400).send('Error: Faltan datos requeridos (empleado o cliente)');
        }
        
        const empleados = await queryDB('SELECT * FROM empleado WHERE IdEmpleado = ?', [empleado]);
        const empleadoInfo = empleados.length > 0 ? empleados[0] : null;
        
        if (!empleadoInfo) {
            return res.status(400).send('Error: Empleado no encontrado');
        }
        
        const clientes = await queryDB('SELECT * FROM cliente WHERE IdCliente = ?', [cliente]);
        const clienteInfo = clientes.length > 0 ? clientes[0] : null;
        
        if (!clienteInfo) {
            return res.status(400).send('Error: Cliente no encontrado');
        }
        
        const pedido = req.session.pedido || [];
        if (pedido.length === 0) {
            return res.status(400).send('Error: No hay productos en el pedido');
        }
        
        const totales = pedido.reduce((acc, item) => {
            acc.totalComp += item.impComp || 0;
            acc.totalDscto += item.impDscto || 0;
            acc.totalVta += item.impVta || 0;
            return acc;
        }, { totalComp: 0, totalDscto: 0, totalVta: 0 });
        
        res.render('detalle-pedido', {
            empleado: empleadoInfo,
            cliente: clienteInfo,
            pais: pais,
            fecha: fecha || new Date().toISOString().split('T')[0],
            pedido: pedido,
            totales: {
                totalComp: totales.totalComp.toFixed(2),
                totalDscto: totales.totalDscto.toFixed(2),
                totalVta: totales.totalVta.toFixed(2)
            }
        });
        
    } catch (error) {
        console.error('Error completo en /detalle-pedido:', error);
        res.status(500).send(`Error interno del servidor: ${error.message}`);
    }
});

router.post('/guardar-pedido', async (req, res) => {
    try {
        console.log('Iniciando guardado de pedido...');
        console.log('Pedido en sesión:', req.session.pedido);
        console.log('Datos recibidos:', req.body);

        const { idEmpleado, fechaPedido, idCliente } = req.body;
        const pedido = req.session.pedido || [];

        if (pedido.length === 0) {
            console.log('Error: No hay productos en el pedido');
            return res.json({ success: false, error: 'No hay productos en el pedido' });
        }

        if (!idEmpleado) {
            console.log('Error: Falta empleado');
            return res.json({ success: false, error: 'Seleccione un empleado' });
        }

        if (!idCliente) {
            console.log('Error: Falta cliente');
            return res.json({ success: false, error: 'Seleccione un cliente' });
        }

        console.log('Buscando cliente...');
        const clientes = await queryDB('SELECT * FROM cliente WHERE IdCliente = ?', [idCliente]);
        const clienteInfo = clientes[0];

        if (!clienteInfo) {
            console.log('Error: Cliente no encontrado');
            return res.json({ success: false, error: 'Cliente no encontrado' });
        }

        console.log('Obteniendo máximo ID de pedido...');
        const maxIdResult = await queryDB('SELECT MAX(IdPedido) as Ultimo FROM pedido');
        const configID = Number(maxIdResult[0].Ultimo || 0);
        const nuevoIdPedido = configID + 1;

        console.log('Nuevo ID de pedido:', nuevoIdPedido);

        const totalPedido = pedido.reduce((sum, item) => sum + item.impVta, 0);
        console.log('Total del pedido:', totalPedido);

        await queryDB(
            `INSERT INTO pedido 
            (IdPedido, IdCliente, IdEmpleado, FechaPedido, FechaEntrega, FechaEnvio, Cargo, 
             Destinatario, DireccionDestinatario, CiudadDestinatario, PaisDestinatario) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nuevoIdPedido, 
                idCliente, 
                idEmpleado, 
                fechaPedido, 
                fechaPedido, 
                fechaPedido, 
                totalPedido,
                clienteInfo.NombreEmpresa,
                clienteInfo.Direccion || '',
                clienteInfo.Ciudad,
                clienteInfo.Pais
            ]
        );

        console.log('Pedido insertado en BD');

        for (const item of pedido) {
            const descuento = item.impComp > 0 ? (item.impDscto / item.impComp) : 0;
            console.log(`Insertando producto: ${item.producto}, Cantidad: ${item.cantidad}`);
            
            await queryDB(
                'INSERT INTO detalles_de_pedido (IdPedido, IdProducto, PrecioUnidad, Cantidad, Descuento) VALUES (?, ?, ?, ?, ?)',
                [nuevoIdPedido, item.id, item.precio, item.cantidad, descuento]
            );

            await queryDB(
                'UPDATE producto SET UnidadesEnExistencia = UnidadesEnExistencia - ? WHERE IdProducto = ?',
                [item.cantidad, item.id]
            );
        }

        req.session.pedido = [];
        console.log('Pedido guardado exitosamente. ID:', nuevoIdPedido);

        res.json({ 
            success: true, 
            pedidoId: nuevoIdPedido,
            message: 'Pedido guardado correctamente'
        });

    } catch (error) {
        console.error('Error al guardar pedido:', error);
        res.json({ success: false, error: error.message });
    }
});


router.get('/detalle-pedido-completo', async (req, res) => {
    try {
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).send('Error: ID de pedido requerido');
        }

        const pedidos = await queryDB(`
            SELECT p.*, 
                   c.NombreEmpresa, c.NombreContacto, c.Direccion as DireccionCliente, 
                   c.Ciudad as CiudadCliente, c.Pais as PaisCliente,
                   e.Nombre as NombreEmpleado, e.Apellidos as ApellidosEmpleado, e.Cargo as CargoEmpleado
            FROM pedido p
            LEFT JOIN cliente c ON p.IdCliente = c.IdCliente
            LEFT JOIN empleado e ON p.IdEmpleado = e.IdEmpleado
            WHERE p.IdPedido = ?
        `, [id]);

        if (pedidos.length === 0) {
            return res.status(404).send('Pedido no encontrado');
        }

        const pedido = pedidos[0];

        const detalles = await queryDB(`
            SELECT dp.*, p.NombreProducto, p.CantidadPorUnidad,
                (dp.PrecioUnidad * dp.Cantidad) as Subtotal,
                (dp.PrecioUnidad * dp.Cantidad * COALESCE(dp.Descuento, 0)) as MontoDescuento, 
                (dp.PrecioUnidad * dp.Cantidad * (1 - COALESCE(dp.Descuento, 0))) as TotalLinea 
            FROM detalles_de_pedido dp
            LEFT JOIN producto p ON dp.IdProducto = p.IdProducto
            WHERE dp.IdPedido = ?
        `, [id]);

        const totales = detalles.reduce((acc, detalle) => {
            acc.subtotal += detalle.PrecioUnidad * detalle.Cantidad;
            acc.descuento += detalle.PrecioUnidad * detalle.Cantidad * (detalle.Descuento || 0); 
            acc.total += detalle.PrecioUnidad * detalle.Cantidad * (1 - (detalle.Descuento || 0)); 
            return acc;
        }, { subtotal: 0, descuento: 0, total: 0 });

        res.render('detalle-pedido-completo', {
            pedido: pedido,
            detalles: detalles,
            totales: {
                subtotal: totales.subtotal.toFixed(2),
                descuento: totales.descuento.toFixed(2), 
                total: totales.total.toFixed(2)
            }
        });

    } catch (error) {
        console.error('Error en detalle-pedido-completo:', error);
        res.status(500).send('Error del servidor: ' + error.message);
    }
});

router.get('/test-db', async (req, res) => {
    try {
        console.log('Probando conexión a BD...');
        
        const result = await queryDB('SELECT 1 + 1 AS test');
        console.log('Test BD exitoso:', result);
        
        const pedidosCount = await queryDB('SELECT COUNT(*) as total FROM pedido');
        console.log('Total pedidos en BD:', pedidosCount[0].total);
        
        res.json({ 
            success: true, 
            test: result[0].test,
            totalPedidos: pedidosCount[0].total
        });
    } catch (error) {
        console.error('Test BD falló:', error);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;