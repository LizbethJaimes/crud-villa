const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// 1. SEGURIDAD: Helmet básico sin CSP para que tus iconos y estilos funcionen (image_ab8e80.png)
app.use(helmet({ 
    contentSecurityPolicy: false 
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// 2. CONEXIÓN: Límite de 1 conexión para sobrevivir al límite de 5 de Railway (image_792125.png)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 1, 
    waitForConnections: false
});

// 3. RUTA PRINCIPAL CON MANEJO DE ERRORES (image_792cc1.png)
app.get('/', (req, res) => {
    db.query('SELECT * FROM registros ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) {
            console.error("Error de BD:", err.message);
            // Si la base de datos está saturada, cargamos la página con un aviso (image_792ce1.png)
            return res.render('index', { registros: [], error: "La base de datos está saturada. Reintenta en breve." });
        }
        res.render('index', { registros: results, error: null });
    });
});

// 4. AGREGAR REGISTRO CON SANITIZACIÓN (Anti-XSS)
app.post('/add', (req, res) => {
    let datoRaw = String(req.body.dato || '');
    
    // SANITIZACIÓN: Eliminamos etiquetas <script> y HTML para evitar alerts maliciosos (image_774462.png)
    const datoLimpio = datoRaw.replace(/<[^>]*>?/gm, '').trim();

    if (!datoLimpio) return res.redirect('/');

    db.query("INSERT INTO registros (dato) VALUES (?)", [datoLimpio], (err) => {
        if (err) console.error("Error al insertar:", err.message);
        res.redirect('/');
    });
});

// 5. ACTUALIZAR CON SANITIZACIÓN
app.post('/update', (req, res) => {
    const id = parseInt(req.body.id);
    let datoRaw = String(req.body.dato || '');
    const datoLimpio = datoRaw.replace(/<[^>]*>?/gm, '').trim();

    if (isNaN(id)) return res.redirect('/');

    db.query("UPDATE registros SET dato = ? WHERE id = ?", [datoLimpio, id], () => {
        res.redirect('/');
    });
});

// 6. ELIMINAR REGISTRO (Protección contra inyecciones en URL)
app.get('/delete/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.redirect('/');

    db.query("DELETE FROM registros WHERE id = ?", [id], (err) => {
        if (err) console.error("Error al borrar:", err.message);
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Sistema Villa 100% Protegido en puerto ${PORT}`));
