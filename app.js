const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// 1. SEGURIDAD BÁSICA (CSP DESACTIVADO)
// Esto permite que los iconos y estilos carguen sin errores (image_ab8e80.png)
app.use(helmet({
    contentSecurityPolicy: false, 
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// 2. POOL DE CONEXIÓN ULTRALIGERO
// Solo 1 conexión para forzar a Railway a liberarse (image_ab7458.png)
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

// 3. RUTAS (Sintaxis corregida para evitar image_79a429.png)
app.get('/', (req, res) => {
    db.query('SELECT * FROM registros ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) {
            console.error("Error de conexión:", err.message);
            // Si la BD falla, cargamos la página vacía pero funcional
            return res.render('index', { registros: [], error: "Base de datos saturada, reintenta en segundos." });
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
app.listen(PORT, () => console.log(`Servidor Protegido en puerto ${PORT}`));
