CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'adotante'
);

CREATE TABLE animais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    status_adoção VARCHAR(20) DEFAULT 'Disponível'
);

CREATE TABLE adocoes (
    id SERIAL PRIMARY KEY,
    id_animal INTEGER REFERENCES animais(id),
    id_adotante INTEGER REFERENCES usuarios(id),
    status VARCHAR(20) DEFAULT 'Pendente'
);