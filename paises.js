const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  secret: '54321',
  resave: false,
  saveUninitialized: false
}));


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'sqltest12',
  database: 'bdmynegocio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/', async (req, res) => {
  try {

    const nombPais = "";
    const [paises] = await pool.query('Select DISTINCT Pais from cliente order by 1');
   // console.log(paises);
    const [clientes] = await pool.query(
      'Select IdCliente,NombreEmpresa,Pais from cliente where Pais=?',
      [nombPais]
    );

    res.render('ClientesxPais', {
      paises: paises,
      clientes: clientes,
    });

  } catch (error) {
    console.error('🚨 Error al obtener paises/clientess:', error);
    res.status(500).send('Error interno del servidor');
  }
});


app.post('/', async (req, res) => {
  try {
    const nombPais  = req.body.cboPais;
    const [paises] = await pool.query('Select DISTINCT Pais from cliente order by 1');
   // console.log(paises);
    const [clientes] = await pool.query(
      'Select IdCliente,NombreEmpresa,Pais from cliente where Pais=?',
      [nombPais]
    );
    //console.log(clientes);
    res.render('ClientesxPais', {
      paises: paises,
      clientes: clientes,
    });

  } catch (error) {
    console.error('🚨 Error al obtener paises/clientess:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en: http://localhost:${port}`);
});
