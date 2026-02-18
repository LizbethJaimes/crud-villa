const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// CONFIGURACIÓN DE SEGURIDAD (HELMET + CSP)
// Esta configuración permite que Bootstrap, los iconos y las fuentes funcionen correctamente
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// SANITIZACIÓN (Anti-XSS)
const sanitize = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>?/gm, '').trim().substring(0, 100);
};

// POOL DE CONEXIONES (Ajustado para Railway)
// El límite de 2 ayuda a que no satures el máximo de 5 de Railway tan rápido
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 2, 
    queueLimit: 0
});

// RUTAS
app.get('/', (req, res) => {
    db.query('SELECT * FROM registros ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) {
            console.error("Detalle del Error de BD:", err.message);
            // Si hay error de conexión (como el de tus capturas), enviamos una lista vacía para que la página cargue
            return res.render('index', { registros: [], error: "Base de datos saturada, reintenta en un momento." });
        }
        res.render('index', { registros: results, error: null });
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
