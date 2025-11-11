const express = require('express');
const { queryDB } = require('../config/database');
const router = express.Router();


router.get('/consulta-pedidos', async (req, res) => {
    try {
        const { fechaInicio, fechaFin, empleado } = req.query;
        
        let query = `
            SELECT p.*, 
                   c.NombreEmpresa as NombreCliente,
                   e.Nombre as NombreEmpleado, 
                   e.Apellidos as ApellidosEmpleado
            FROM pedido p
            LEFT JOIN cliente c ON p.IdCliente = c.IdCliente
            LEFT JOIN empleado e ON p.IdEmpleado = e.IdEmpleado
            WHERE 1=1
        `;
        
        const params = [];
        
        if (fechaInicio) {
            query += ' AND p.FechaPedido >= ?';
            params.push(fechaInicio);
        }
        
        if (fechaFin) {
            query += ' AND p.FechaPedido <= ?';
            params.push(fechaFin);
        }
        
        if (empleado) {
            query += ' AND p.IdEmpleado = ?';
            params.push(empleado);
        }
        
        query += ' ORDER BY p.FechaPedido DESC, p.IdPedido DESC';
        
        const pedidos = await queryDB(query, params);
        const empleados = await queryDB('SELECT IdEmpleado, Nombre, Apellidos FROM empleado ORDER BY Nombre');
        
        res.render('consulta-pedidos', {
            pedidos,
            empleados,
            fechaInicio: fechaInicio || '',
            fechaFin: fechaFin || '',
            empleadoFiltro: empleado || ''
        });
        
    } catch (error) {
        console.error('Error en consulta-pedidos:', error);
        res.status(500).send('Error del servidor');
    }
});


router.get('/consulta-pedidos-cliente', async (req, res) => {
    try {
        const { cliente, fechaInicio, fechaFin, pagina = 1 } = req.query;
        const itemsPorPagina = 15;
        const offset = (pagina - 1) * itemsPorPagina;
        
        
        let countQuery = `
            SELECT COUNT(*) as total
            FROM pedido p
            LEFT JOIN cliente c ON p.IdCliente = c.IdCliente
            WHERE 1=1
        `;
        
        const countParams = [];
        
        if (cliente) {
            countQuery += ' AND p.IdCliente = ?';
            countParams.push(cliente);
        }
        
        if (fechaInicio) {
            countQuery += ' AND p.FechaPedido >= ?';
            countParams.push(fechaInicio);
        }
        
        if (fechaFin) {
            countQuery += ' AND p.FechaPedido <= ?';
            countParams.push(fechaFin);
        }
        
        const countResult = await queryDB(countQuery, countParams);
        const totalPedidos = countResult[0].total;
        const totalPaginas = Math.ceil(totalPedidos / itemsPorPagina);
  
        let query = `
            SELECT 
                p.*, 
                c.NombreEmpresa, 
                c.NombreContacto, 
                c.Pais,
                e.Nombre as NombreEmpleado,
                (SELECT COUNT(*) FROM detalles_de_pedido dp WHERE dp.IdPedido = p.IdPedido) as CantidadProductos,
                (SELECT SUM(dp.PrecioUnidad * dp.Cantidad * (1 - COALESCE(dp.Descuento, 0)/100)) 
                 FROM detalles_de_pedido dp 
                 WHERE dp.IdPedido = p.IdPedido) as TotalCalculado
            FROM pedido p
            LEFT JOIN cliente c ON p.IdCliente = c.IdCliente
            LEFT JOIN empleado e ON p.IdEmpleado = e.IdEmpleado
            WHERE 1=1
        `;
        
        const queryParams = [];
        
        if (cliente) {
            query += ' AND p.IdCliente = ?';
            queryParams.push(cliente);
        }
        
        if (fechaInicio) {
            query += ' AND p.FechaPedido >= ?';
            queryParams.push(fechaInicio);
        }
        
        if (fechaFin) {
            query += ' AND p.FechaPedido <= ?';
            queryParams.push(fechaFin);
        }
        
        query += ' ORDER BY p.FechaPedido DESC LIMIT ? OFFSET ?';
        queryParams.push(itemsPorPagina, offset);
        
        const pedidos = await queryDB(query, queryParams);
        const clientes = await queryDB('SELECT IdCliente, NombreEmpresa, Pais FROM cliente ORDER BY NombreEmpresa');
        
        const generarUrlPaginacion = (pagina) => {
            let url = `/consulta-pedidos-cliente?pagina=${pagina}`;
            if (cliente) url += `&cliente=${cliente}`;
            if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
            if (fechaFin) url += `&fechaFin=${fechaFin}`;
            return url;
        };
        
        res.render('consulta-pedidos-cliente', {
            pedidos,
            clientes,
            totalPedidos,
            paginaActual: parseInt(pagina),
            totalPaginas,
            clienteFiltro: cliente || '',
            fechaInicio: fechaInicio || '',
            fechaFin: fechaFin || '',
            generarUrlPaginacion
        });
        
    } catch (error) {
        console.error('Error en consulta-pedidos-cliente:', error);
        res.status(500).send('Error del servidor: ' + error.message);
    }
});


router.get('/consulta-categorias', async (req, res) => {
    try {
        const { categoria } = req.query;
        
        
        const categorias = await queryDB(`
            SELECT c.*, 
                   COUNT(p.IdProducto) as CantidadProductos,
                   SUM(p.UnidadesEnExistencia) as StockTotal
            FROM categoria c
            LEFT JOIN producto p ON c.IdCategoria = p.IdCategoria
            GROUP BY c.IdCategoria
            ORDER BY c.NombreCategoria
        `);
        
        
        const totalProductos = categorias.reduce((sum, cat) => sum + (cat.CantidadProductos || 0), 0);
        const totalStock = categorias.reduce((sum, cat) => sum + (cat.StockTotal || 0), 0);
        
        
        const valorResult = await queryDB(`
            SELECT SUM(p.PrecioUnidad * p.UnidadesEnExistencia) as ValorTotal
            FROM producto p
        `);
        const valorTotalStock = valorResult[0].ValorTotal || 0;
        
        let productosCategoria = [];
        let categoriaSeleccionada = '';
        
        if (categoria) {
            productosCategoria = await queryDB(`
                SELECT * FROM producto 
                WHERE IdCategoria = ? 
                ORDER BY NombreProducto
            `, [categoria]);
            
            const cat = categorias.find(c => c.IdCategoria == categoria);
            categoriaSeleccionada = cat ? cat.NombreCategoria : '';
        }
        
        res.render('consulta-categorias', {
            categorias,
            productosCategoria,
            categoriaSeleccionada,
            totalProductos,
            totalStock,
            valorTotalStock
        });
        
    } catch (error) {
        console.error('Error en consulta-categorias:', error);
        res.status(500).send('Error del servidor');
    }
});


router.get('/consulta-empleados', async (req, res) => {
    try {
        const empleados = await queryDB(`
            SELECT 
                *,
                TelDomicilio as Telefono,
                FechaContratación as FechaContratacion
            FROM empleado 
            ORDER BY Nombre, Apellidos
        `);
        
      
        const cargosCount = {};
        empleados.forEach(emp => {
            cargosCount[emp.Cargo] = (cargosCount[emp.Cargo] || 0) + 1;
        });
        
        res.render('consulta-empleados', {
            empleados,
            cargosCount
        });
        
    } catch (error) {
        console.error('Error en consulta-empleados:', error);
        res.status(500).send('Error del servidor: ' + error.message);
    }
});
// parcial
router.get('/reporte-ventas', async (req, res) => {
    try {
        const { pais, cliente } = req.query;
        
        console.log('=== REPORTE VENTAS - PARÁMETROS ===');
        console.log('País:', pais);
        console.log('Cliente:', cliente);
        
        // Obtener países y clientes para los combos
        const [paises, clientes] = await Promise.all([
            queryDB('SELECT DISTINCT Pais FROM cliente ORDER BY Pais'),
            queryDB('SELECT IdCliente, NombreEmpresa, Pais FROM cliente ORDER BY Pais, NombreEmpresa')
        ]);

        let resultados = [];
        
        // Si hay filtros seleccionados, generar el reporte
        if (pais && cliente) {
            console.log('=== EJECUTANDO CONSULTA ===');
            
            resultados = await queryDB(`
                SELECT 
                    c.IdCategoria,
                    c.NombreCategoria as Categoria,
                    SUM(dp.PrecioUnidad * dp.Cantidad) as TotalImporteCompra,
                    SUM(dp.PrecioUnidad * dp.Cantidad * COALESCE(dp.Descuento, 0)) as TotalImporteDescuento,
                    SUM(dp.PrecioUnidad * dp.Cantidad * (1 - COALESCE(dp.Descuento, 0))) as TotalImporteVenta
                FROM detalles_de_pedido dp
                INNER JOIN pedido p ON dp.IdPedido = p.IdPedido
                INNER JOIN producto pr ON dp.IdProducto = pr.IdProducto
                INNER JOIN categoria c ON pr.IdCategoria = c.IdCategoria
                INNER JOIN cliente cl ON p.IdCliente = cl.IdCliente
                WHERE cl.IdCliente = ?  -- Solo filtro por cliente, no por país
                GROUP BY c.IdCategoria, c.NombreCategoria
                ORDER BY c.NombreCategoria
            `, [cliente]);  // Solo pasamos el cliente, no el país

            console.log('=== RESULTADOS OBTENIDOS ===');
            console.log('Número de resultados:', resultados.length);
            if (resultados.length > 0) {
                console.log('Primer resultado:', resultados[0]);
                console.log('Total Importe Compra:', resultados[0].TotalImporteCompra);
                console.log('Total Importe Descuento:', resultados[0].TotalImporteDescuento);
                console.log('Total Importe Venta:', resultados[0].TotalImporteVenta);
            }
        }

        res.render('reporte-ventas', {
            paises,
            clientes,
            resultados,
            paisSeleccionado: pais || '',
            clienteSeleccionado: cliente || ''
        });
        
    } catch (error) {
        console.error('Error en reporte-ventas:', error);
        res.status(500).send('Error del servidor: ' + error.message);
    }
});

module.exports = router;