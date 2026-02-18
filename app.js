const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

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
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/', (req, res) => {
    db.query('SELECT * FROM registros ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) {
            console.error("ERROR DE BD:", err);
            return res.status(500).send("Error de base de datos");
        }
        res.render('index', { registros: results });
    });
});

// Ruta para agregar
app.post('/add', (req, res) => {
    const datoLimpio = sanitize(req.body.dato);
    if (!datoLimpio) return res.redirect('/');
    db.query("INSERT INTO registros (dato) VALUES (?)", [datoLimpio], () => res.redirect('/'));
});

app.post('/update', (req, res) => {
    const { id, dato } = req.body;
    const datoLimpio = sanitize(dato);
    db.query("UPDATE registros SET dato = ? WHERE id = ?", [datoLimpio, id], () => res.redirect('/'));
});

app.get('/delete/:id', (req, res) => {
    db.query("DELETE FROM registros WHERE id = ?", [req.params.id], () => res.redirect('/'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
