const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// 1. SEGURIDAD: Helmet sin CSP para permitir Bootstrap e Iconos (Corrige image_ab8e80.png)
app.use(helmet({ 
    contentSecurityPolicy: false 
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// 2. CONEXIÓN: Pool limitado a 1 para no saturar Railway (Corrige image_acd8a3.png)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 1, 
    waitForConnections: false,
    queueLimit: 0
});

// FUNCIÓN DE SANITIZACIÓN PRO (Anti-XSS avanzado)
const sanatize = (text) => {
    return String(text || '')
        .replace(/<[^>]*>?/gm, '') // Elimina etiquetas HTML
        .replace(/on\w+\s*=/gi, 'no-js=') // Desactiva eventos JS (onclick, onerror, etc)
        .substring(0, 100) // Evita desbordamiento
        .trim();
};

// 3. RUTAS
app.get('/', (req, res) => {
    db.query('SELECT * FROM registros ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) {
            console.error("Error de BD:", err.message);
            return res.render('index', { registros: [], error: "Base de Datos ocupada. Reintenta." });
        }
        res.render('index', { registros: results, error: null });
    });
});

app.post('/add', (req, res) => {
    const datoLimpio = sanatize(req.body.dato);
    if (!datoLimpio) return res.redirect('/');

    db.query("INSERT INTO registros (dato) VALUES (?)", [datoLimpio], (err) => {
        if (err) console.error(err.message);
        res.redirect('/');
    });
});

app.post('/update', (req, res) => {
    const id = parseInt(req.body.id);
    const datoLimpio = sanatize(req.body.dato);
    if (isNaN(id) || !datoLimpio) return res.redirect('/');

    db.query("UPDATE registros SET dato = ? WHERE id = ?", [datoLimpio, id], () => {
        res.redirect('/');
    });
});

app.get('/delete/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.redirect('/');
    db.query("DELETE FROM registros WHERE id = ?", [id], () => res.redirect('/'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor Protegido en puerto ${PORT}`));
