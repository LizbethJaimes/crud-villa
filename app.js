const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const sanitize = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .replace(/<[^>]*>?/gm, '') 
        .replace(/[<>]/g, '')      
        .trim()
        .substring(0, 150);        
};

const db = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'villa',
    port: process.env.MYSQLPORT || 3306
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.message);
        return;
    }
    console.log('Conexión exitosa a la base de datos');
});

app.get('/', (req, res) => {
    db.query('SELECT * FROM registros ORDER BY id DESC LIMIT 10', (err, results) => {
        if (err) {
            console.error("Error al leer Railway:", err);
            return res.status(500).send("Error de conexión");
        }
        //  los 10 resultados a la vista
        res.render('index', { registros: results });
    });
});

app.post('/add', (req, res) => {
    const nuevoDato = sanitize(req.body.dato); 
    if (!nuevoDato) return res.redirect('/'); 

    const sql = "INSERT INTO registros (dato) VALUES (?)"; 
    db.query(sql, [nuevoDato], (err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

app.post('/update', (req, res) => {
    const id = req.body.id;
    const dato = sanitize(req.body.dato); 
    const sql = "UPDATE registros SET dato = ? WHERE id = ?";
    db.query(sql, [dato, id], (err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

app.get('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM registros WHERE id = ?";
    db.query(sql, [id], (err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor en puerto: ${PORT}`);
});
