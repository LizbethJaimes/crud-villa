const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// 1. SEGURIDAD BÁSICA (Sin CSP para no bloquear iconos)
app.use(helmet({
    contentSecurityPolicy: false, // Desactivamos el filtro que bloquea tus estilos e iconos
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// 2. POOL DE CONEXIONES (Ajustado para el límite de Railway)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: false,
    connectionLimit: 1, // Usamos solo 1 para liberar el límite de 5 de Railway
    queueLimit: 0
});

// 3. RUTAS CORREGIDAS
app.get('/', (req, res) => {
    db.query('SELECT * FROM registros ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) {
            console.error("Error BD:", err.message); // Ver detalle en logs de Render
            return res.render('index', { registros: [], error: "Base de datos saturada. Espera 10 segundos." });
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
