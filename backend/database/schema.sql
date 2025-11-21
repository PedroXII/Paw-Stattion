-- Tabela de usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_criptografada VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('admin', 'voluntario', 'adotante', 'doador')),
    telefone VARCHAR(20),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de animais
CREATE TABLE animais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raca VARCHAR(100),
    idade INTEGER,
    status_saude TEXT,
    status_adoção VARCHAR(20) DEFAULT 'Disponível' CHECK (status_adoção IN ('Disponível', 'Adotado', 'Em Processo')),
    data_entrada DATE NOT NULL
);

-- Tabela de adoções
CREATE TABLE adocoes (
    id SERIAL PRIMARY KEY,
    id_animal INTEGER NOT NULL,
    id_adotante INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovada', 'Rejeitada')),
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP,
    observacoes_administrador TEXT,
    
    FOREIGN KEY (id_animal) REFERENCES animais(id) ON DELETE CASCADE,
    FOREIGN KEY (id_adotante) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de doações
CREATE TABLE doacoes (
    id SERIAL PRIMARY KEY,
    id_doador INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('financeira', 'ração', 'medicamento', 'outros')),
    valor VARCHAR(255) NOT NULL,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_doador) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de registros médicos
CREATE TABLE registros_medicos (
    id SERIAL PRIMARY KEY,
    id_animal INTEGER NOT NULL,
    procedimento VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    observacoes TEXT,
    
    FOREIGN KEY (id_animal) REFERENCES animais(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_animais_especie ON animais(especie);
CREATE INDEX idx_animais_status ON animais(status_adoção);
CREATE INDEX idx_adocoes_status ON adocoes(status);
CREATE INDEX idx_adocoes_animal ON adocoes(id_animal);
CREATE INDEX idx_adocoes_adotante ON adocoes(id_adotante);
CREATE INDEX idx_doacoes_doador ON doacoes(id_doador);
CREATE INDEX idx_registros_medicos_animal ON registros_medicos(id_animal);

-- Dados iniciais para teste
-- Inserir um administrador padrão (senha: admin123)
INSERT INTO usuarios (nome, email, senha_criptografada, tipo, telefone) VALUES
('Administrador', 'admin@pawstation.com', '$2b$10$K9s5f.8Vv8Vv8Vv8Vv8VvO', 'admin', '(85) 99999-9999');

-- Inserir alguns animais de exemplo
INSERT INTO animais (nome, especie, raca, idade, status_saude, status_adoção, data_entrada) VALUES
('Rex', 'Cachorro', 'Vira-lata', 2, 'Saudável, vacinado, vermifugado', 'Disponível', '2024-01-15'),
('Luna', 'Gato', 'Siamês', 1, 'Castrada, vacinada', 'Disponível', '2024-02-20'),
('Thor', 'Cachorro', 'Labrador', 3, 'Saudável, aguardando castração', 'Em Processo', '2024-03-10');

-- Inserir alguns registros médicos de exemplo
INSERT INTO registros_medicos (id_animal, procedimento, data, observacoes) VALUES
(1, 'Vacina V10', '2024-01-20', 'Aplicada primeira dose'),
(1, 'Vermifugação', '2024-01-20', 'Vermífugo padrão'),
(2, 'Castração', '2024-03-01', 'Procedimento realizado com sucesso'),
(2, 'Vacina Quádrupla', '2024-03-15', 'Reforço anual');