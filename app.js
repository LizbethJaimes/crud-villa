const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
        },
    },
}));

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
    waitForConnections: false, // ¡IMPORTANTE! Si no hay conexión, que falle rápido en lugar de esperar
    connectionLimit: 1,        // Usamos solo UNA para dejar las otras 4 libres por si se desbloquean
    queueLimit: 0,
    enableKeepAlive: false     // Obliga a cerrar la conexión apenas termine la consulta
});
app.get('/', (req, res) => {
    // Intentamos la consulta con un tiempo de espera (timeout) corto
    db.query({
        sql: 'SELECT * FROM registros ORDER BY id DESC LIMIT 10',
        timeout: 2000 // Si en 2 segundos no responde por culpa del SLEEP, cancela
    }, (err, results) => {
        if (err) {
            console.error("Servidor ocupado:", err.message);
            // Enviamos la tabla vacía pero con un mensaje de aviso
            return res.render('index', { 
                registros: [], 
                error: "Conexión lenta detectada. Los datos aparecerán cuando se liberen las conexiones." 
            });
        }
        // Si hay éxito, renderizamos normal
        res.render('index', { registros: results, error: null });
    });
});
});

app.post('/add', (req, res) => {
    const dato = sanitize(req.body.dato);
    if (!dato) return res.redirect('/');
    // Uso de Prepared Statements para evitar Inyección SQL
    db.query("INSERT INTO registros (dato) VALUES (?)", [dato], () => res.redirect('/'));
});

// ... (Resto de tus rutas: update y delete permanecen igual)

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor Protegido en puerto ${PORT}`));
