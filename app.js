const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Configuración de Seguridad corregida para evitar bloqueos (image_798ddf.png)
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

// Pool de una sola conexión para "desbloquear" Railway
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: false, // No esperar si está lleno
    connectionLimit: 1,        // Solo 1 conexión para no saturar
    queueLimit: 0
});

app.get('/', (req, res) => {
    db.query('SELECT * FROM registros ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) {
            console.error("Error de BD:", err.message);
            // Renderizamos la tabla vacía con el error para que la app no muera
            return res.render('index', { registros: [], error: "Base de datos saturada. Reintenta en 1 minuto." });
        }
        res.render('index', { registros: results, error: null });
    });
});

app.post('/add', (req, res) => {
    const { dato } = req.body;
    db.query("INSERT INTO registros (dato) VALUES (?)", [dato], () => res.redirect('/'));
});

// Asegúrate de que estas rutas existan y estén bien cerradas
app.post('/update', (req, res) => {
    const { id, dato } = req.body;
    db.query("UPDATE registros SET dato = ? WHERE id = ?", [dato, id], () => res.redirect('/'));
});

app.get('/delete/:id', (req, res) => {
    db.query("DELETE FROM registros WHERE id = ?", [req.params.id], () => res.redirect('/'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
