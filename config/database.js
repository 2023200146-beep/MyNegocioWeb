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

const db = mysql.createConnection(dbConfig);

const queryDB = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

db.connect((err) => {
    if (err) {
        console.error('Error conectando a la BD:', err.message);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

module.exports = { db, queryDB };