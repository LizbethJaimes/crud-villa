const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

app.get('/', (req, res) => {
    db.query('SELECT * FROM registros', (err, results) => {
        if (err) throw err;
        res.render('index', { registros: results });
    });
});


app.post('/add', (req, res) => {
    const nuevoDato = req.body.dato;
    const sql = "INSERT INTO registros (dato) VALUES (?)"; 
    db.query(sql, [nuevoDato], (err) => {
        if (err) console.log(err);
        res.redirect('/');
    });
});


app.post('/update', (req, res) => {
    const { id, dato } = req.body;
    const sql = "UPDATE registros SET dato = ? WHERE id = ?";
    db.query(sql, [dato, id], (err) => {
        if (err) console.log(err);
        res.redirect('/');
    });
});


app.get('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM registros WHERE id = ?";
    db.query(sql, [id], (err) => {
        if (err) console.log(err);
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
