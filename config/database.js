const mysql = require('mysql2');

const dbConfig = {
    host: 'bdmynegocio-ucss-18be.g.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_2OXAaMpicsY49ZMAY_w',
    database: 'bdmynegocio',
    port: 15841,
    ssl: {
        rejectUnauthorized: false
    }
};

console.log('Configuración BD:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port
});

const db = mysql.createConnection(dbConfig);

const queryDB = (sql, params = []) => {
    console.log('Ejecutando query:', sql, 'Params:', params);
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Error en query:', err.message);
                reject(err);
            } else {
                console.log('Query exitosa. Resultados:', results.length);
                resolve(results);
            }
        });
    });
};

db.connect((err) => {
    if (err) {
        console.error('Error conectando a la BD:', err.message);
        console.error('Detalles del error:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL en producción');
});

module.exports = { db, queryDB };