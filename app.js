const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const helmet = require('helmet');
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], 
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"], 
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"], 
      imgSrc: ["'self'", "data:"], 
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"], 
      objectSrc: ["'none'"], 
      upgradeInsecureRequests: [], 
    },
  })
);

const sanitize = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>?/gm, '').trim().substring(0, 100);
};

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 3, 
    queueLimit: 0
});

app.get('/', (req, res) => {
    db.query('SELECT * FROM registros ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) {
            console.error("Error de BD:", err);
            return res.status(500).send("Error de base de datos");
        }
        res.render('index', { registros: results });
    });
});

app.post('/add', (req, res) => {
    const dato = sanitize(req.body.dato);
    if (!dato) return res.redirect('/');
    db.query("INSERT INTO registros (dato) VALUES (?)", [dato], () => res.redirect('/'));
});

app.post('/update', (req, res) => {
    const { id, dato } = req.body;
    const datoLimpio = sanitize(dato);
    db.query("UPDATE registros SET dato = ? WHERE id = ?", [datoLimpio, id], () => res.redirect('/'));
});

app.get('/delete/:id', (req, res) => {
    db.query("DELETE FROM registros WHERE id = ?", [req.params.id], () => res.redirect('/'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Sistema Villa Protegido en puerto ${PORT}`));
