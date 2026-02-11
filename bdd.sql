CREATE DATABASE villa;
USE villa;

CREATE TABLE registros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dato VARCHAR(255) NOT NULL
);

INSERT INTO registros (dato) VALUES ('Primer registro de prueba');

SELECT * FROM registros;