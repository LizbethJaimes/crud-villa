const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// 1. CONFIGURACIÓN DE SEGURIDAD (Corrige image_798ddf.png)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
        },
    },
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// 2. POOL DE CONEXIONES (Corrige image_ab7458.png)
// Usamos solo 1 conexión para permitir que Railway respire
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: false,
    connectionLimit: 1, 
    queueLimit: 0
});

// 3. RUTAS (Arreglada la sintaxis de image_79a429.png)
app.get('/', (req, res) => {
    db.query('SELECT * FROM registros ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) {
            console.error("Error BD:", err.message);
            return res.render('index', { registros: [], error: "Base de datos saturada." });
        }
        res.render('index', { registros: results, error: null });
    });
});

app.post('/add', (req, res) => {
    const { dato } = req.body;
    if (!dato) return res.redirect('/');
    db.query("INSERT INTO registros (dato) VALUES (?)", [dato], () => res.redirect('/'));
});

app.post('/update', (req, res) => {
    const { id, dato } = req.body;
    db.query("UPDATE registros SET dato = ? WHERE id = ?", [dato, id], () => res.redirect('/'));
});

app.get('/delete/:id', (req, res) => {
    db.query("DELETE FROM registros WHERE id = ?", [req.params.id], () => res.redirect('/'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
